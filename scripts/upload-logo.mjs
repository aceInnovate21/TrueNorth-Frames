// One-off: (re)upload the brand logo to the public R2 bucket.
//
//   node scripts/upload-logo.mjs            → uploads public/logo.png as "logo.png"
//   node scripts/upload-logo.mjs brand/logo.png   → custom key
//
// Reads R2 creds from .env.local / .env (or the ambient environment).

import { readFileSync, existsSync } from 'node:fs'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

// Load env from .env.local then .env (without overriding already-set vars)
for (const f of ['.env.local', '.env']) {
  if (!existsSync(f)) continue
  for (const line of readFileSync(f, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}

const {
  R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL,
} = process.env

const missing = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME']
  .filter(k => !process.env[k])
if (missing.length) {
  console.error(`Missing env vars: ${missing.join(', ')}\nRun this from the project root with your .env.local present.`)
  process.exit(1)
}

const key = process.argv[2] || 'logo.png'
const filePath = 'public/logo.png'
if (!existsSync(filePath)) { console.error(`Not found: ${filePath}`); process.exit(1) }

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
})

await r2.send(new PutObjectCommand({
  Bucket: R2_BUCKET_NAME,
  Key: key,
  Body: readFileSync(filePath),
  ContentType: 'image/png',
  CacheControl: 'public, max-age=31536000, immutable',
}))

console.log(`✓ Uploaded ${filePath} → ${R2_BUCKET_NAME}/${key}`)
if (R2_PUBLIC_URL) console.log(`  Public URL: ${R2_PUBLIC_URL}/${key}`)
