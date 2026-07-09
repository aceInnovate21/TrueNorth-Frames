import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

// Public bucket — portfolio photos/videos, avatars, covers, package banners.
// Served via a public r2.dev URL.
export const BUCKET = process.env.R2_BUCKET_NAME!
const PUBLIC_URL = process.env.R2_PUBLIC_URL!

// Private bucket — message/DM/group attachments. Public access OFF; read only
// via short-lived signed URLs. Falls back to the public bucket name if unset so
// local dev without the env var doesn't crash at import (uploads will 403 until set).
export const PRIVATE_BUCKET = process.env.R2_PRIVATE_BUCKET_NAME || BUCKET

export function getPublicUrl(key: string) {
  return `${PUBLIC_URL}/${key}`
}

export async function uploadToR2(key: string, body: Buffer | Uint8Array, contentType: string) {
  await r2.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: body, ContentType: contentType }))
  return getPublicUrl(key)
}

export async function deleteFromR2(key: string) {
  await r2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))
}

/** Delete an object from a specific bucket (used by orphan cleanup — assets store their bucket). */
export async function deleteFromBucket(bucket: string, key: string) {
  await r2.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
}

// ─── Public-bucket presign (portfolio direct uploads) ────────────────────────

export async function createPresignedUploadUrl(key: string, contentType: string, expiresIn = 900) {
  return getSignedUrl(r2, new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType }), { expiresIn })
}

export async function createPresignedDownloadUrl(key: string, expiresIn = 900) {
  return getSignedUrl(r2, new GetObjectCommand({ Bucket: BUCKET, Key: key }), { expiresIn })
}

// ─── Private-bucket presign (message attachments) ────────────────────────────

/** Presigned PUT so the browser can upload a message attachment straight to the private bucket. */
export async function createPrivateUploadUrl(key: string, contentType: string, expiresIn = 900) {
  return getSignedUrl(r2, new PutObjectCommand({ Bucket: PRIVATE_BUCKET, Key: key, ContentType: contentType }), { expiresIn })
}

/** Short-lived signed GET so only the intended recipient can view a private attachment. */
export async function createPrivateDownloadUrl(key: string, expiresIn = 6 * 60 * 60) {
  return getSignedUrl(r2, new GetObjectCommand({ Bucket: PRIVATE_BUCKET, Key: key }), { expiresIn })
}

export async function deleteFromPrivateR2(key: string) {
  await r2.send(new DeleteObjectCommand({ Bucket: PRIVATE_BUCKET, Key: key }))
}
