/**
 * TrueNorth Frames — R2 Budget Guard Worker
 *
 * Runs every 6 hours via Cron Trigger.
 * Queries Cloudflare GraphQL Analytics for R2 usage.
 * If usage exceeds thresholds, removes bucket public access and sends an alert email.
 *
 * Required Worker secrets (set via wrangler secret put):
 *   CF_API_TOKEN       — Cloudflare API token with R2:Edit + Account Analytics:Read
 *   CF_ACCOUNT_ID      — Your Cloudflare account ID
 *   CF_BUCKET_NAME     — R2 bucket name (truenorth-frames)
 *   ALERT_EMAIL        — Email to notify (uses Cloudflare Email Routing or MailChannels)
 *   RESEND_API_KEY     — Resend API key for alert emails
 *   ALERT_FROM_EMAIL   — Sender address verified in Resend
 */

// Free tier limits
const FREE_STORAGE_BYTES = 10 * 1024 * 1024 * 1024  // 10 GB
const FREE_CLASS_A_OPS   = 1_000_000                 // 1M writes/month
const FREE_CLASS_B_OPS   = 10_000_000                // 10M reads/month

// Suspend at 80% of free tier
const STORAGE_THRESHOLD  = FREE_STORAGE_BYTES * 0.80
const CLASS_A_THRESHOLD  = FREE_CLASS_A_OPS   * 0.80
const CLASS_B_THRESHOLD  = FREE_CLASS_B_OPS   * 0.80

export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(runBudgetCheck(env))
  },

  // Also allow manual trigger via HTTP GET for testing
  async fetch(request, env) {
    if (request.method !== 'GET') {
      return new Response('Method not allowed', { status: 405 })
    }
    const result = await runBudgetCheck(env)
    return new Response(JSON.stringify(result, null, 2), {
      headers: { 'Content-Type': 'application/json' },
    })
  },
}

async function runBudgetCheck(env) {
  const usage = await fetchR2Usage(env)
  const log = {
    checked_at: new Date().toISOString(),
    usage,
    action_taken: null,
    suspended: false,
  }

  const storageExceeded = usage.storage_bytes > STORAGE_THRESHOLD
  const classAExceeded  = usage.class_a_ops   > CLASS_A_THRESHOLD
  const classBExceeded  = usage.class_b_ops   > CLASS_B_THRESHOLD

  if (storageExceeded || classAExceeded || classBExceeded) {
    const reasons = []
    if (storageExceeded) reasons.push(`Storage: ${toGB(usage.storage_bytes)} GB / 10 GB`)
    if (classAExceeded)  reasons.push(`Write ops: ${usage.class_a_ops.toLocaleString()} / 1,000,000`)
    if (classBExceeded)  reasons.push(`Read ops: ${usage.class_b_ops.toLocaleString()} / 10,000,000`)

    // Remove public access on the bucket to stop reads
    await suspendBucketPublicAccess(env)

    // Send alert email via Resend
    await sendAlert(env, reasons)

    log.action_taken = reasons.join('; ')
    log.suspended = true
  }

  // Store result in KV for history
  await env.R2_BUDGET_LOG.put(
    `check:${new Date().toISOString()}`,
    JSON.stringify(log),
    { expirationTtl: 60 * 60 * 24 * 30 } // keep 30 days of history
  )

  return log
}

async function fetchR2Usage(env) {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const query = `
    query R2Usage($accountId: String!, $since: String!) {
      viewer {
        accounts(filter: { accountTag: $accountId }) {
          r2StorageAdaptiveGroups(
            filter: { date_geq: $since }
            limit: 1
            orderBy: [date_DESC]
          ) {
            max { payloadSize }
          }
          r2OperationsAdaptiveGroups(
            filter: { date_geq: $since }
            limit: 10000
          ) {
            sum { requests }
            dimensions { actionType }
          }
        }
      }
    }
  `

  const resp = await fetch('https://api.cloudflare.com/client/v4/graphql', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.CF_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables: { accountId: env.CF_ACCOUNT_ID, since: startOfMonth },
    }),
  })

  const data = await resp.json()
  const account = data?.data?.viewer?.accounts?.[0]

  const storageBytes = account?.r2StorageAdaptiveGroups?.[0]?.max?.payloadSize ?? 0
  const ops = account?.r2OperationsAdaptiveGroups ?? []

  // Class A = writes (PutObject, DeleteObject, etc.)
  // Class B = reads (GetObject, HeadObject, etc.)
  const CLASS_A_ACTIONS = ['PutObject', 'CopyObject', 'CompleteMultipartUpload', 'CreateMultipartUpload', 'UploadPart', 'DeleteObject', 'DeleteObjects']
  const CLASS_B_ACTIONS = ['GetObject', 'HeadObject', 'ListObjects', 'ListObjectsV2', 'ListMultipartUploads', 'ListParts']

  let classAOps = 0
  let classBOps = 0
  for (const group of ops) {
    if (CLASS_A_ACTIONS.includes(group.dimensions?.actionType)) classAOps += group.sum?.requests ?? 0
    if (CLASS_B_ACTIONS.includes(group.dimensions?.actionType)) classBOps += group.sum?.requests ?? 0
  }

  return { storage_bytes: storageBytes, class_a_ops: classAOps, class_b_ops: classBOps }
}

async function suspendBucketPublicAccess(env) {
  // Cloudflare R2 API — disable public access on the bucket
  await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/r2/buckets/${env.CF_BUCKET_NAME}`,
    {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${env.CF_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ access: 'private' }),
    }
  )
}

async function sendAlert(env, reasons) {
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.ALERT_FROM_EMAIL,
      to: [env.ALERT_EMAIL],
      subject: '🚨 TrueNorth Frames — R2 Budget Threshold Reached',
      html: `
        <h2>R2 Budget Guard — Action Taken</h2>
        <p>R2 usage has exceeded 80% of the free tier. Public bucket access has been <strong>suspended</strong> to prevent charges.</p>
        <h3>Usage details:</h3>
        <ul>${reasons.map(r => `<li>${r}</li>`).join('')}</ul>
        <h3>What happened:</h3>
        <p>Bucket <code>${env.CF_BUCKET_NAME}</code> has been set to <strong>private</strong>. Portfolio images will no longer load publicly until you re-enable access.</p>
        <h3>To re-enable:</h3>
        <ol>
          <li>Go to Cloudflare R2 dashboard</li>
          <li>Open bucket <code>${env.CF_BUCKET_NAME}</code> → Settings → Public Access</li>
          <li>Re-enable public access</li>
          <li>Consider upgrading to R2 paid tier ($0.015/GB) if you're growing</li>
        </ol>
        <p><small>Checked at: ${new Date().toISOString()}</small></p>
      `,
    }),
  })
}

function toGB(bytes) {
  return (bytes / (1024 * 1024 * 1024)).toFixed(2)
}
