import { PLATFORM_CONFIG } from './platform-config'

/**
 * Per-photographer storage quota, computed live from `storage_assets`.
 *
 * We sum `size_bytes` of the owner's *claimed* assets (orphan_expires_at IS NULL)
 * across portfolio + profile entity types. Nothing is cached, so the number can
 * never drift from reality. Cheap thanks to the (owner_id, entity_type) index.
 */

export const STORAGE_QUOTA_BYTES = PLATFORM_CONFIG.max_storage_bytes_per_photographer

const COUNTED_ENTITY_TYPES = ['portfolio_photo', 'portfolio_video', 'avatar', 'cover'] as const

export interface StorageUsage {
  photos_bytes: number
  videos_bytes: number
  profile_bytes: number   // avatar + cover
  used_bytes: number
  quota_bytes: number
  remaining_bytes: number
  pct: number             // 0–100, rounded
}

export async function getStorageUsage(db: any, userId: string): Promise<StorageUsage> {
  const { data } = await db
    .from('storage_assets')
    .select('entity_type, size_bytes')
    .eq('owner_id', userId)
    .is('orphan_expires_at', null)
    .in('entity_type', COUNTED_ENTITY_TYPES as unknown as string[])

  let photos = 0
  let videos = 0
  let profile = 0
  for (const row of data ?? []) {
    const bytes = Number(row.size_bytes) || 0
    if (row.entity_type === 'portfolio_photo') photos += bytes
    else if (row.entity_type === 'portfolio_video') videos += bytes
    else profile += bytes // avatar | cover
  }

  const used = photos + videos + profile
  const quota = STORAGE_QUOTA_BYTES
  const remaining = Math.max(0, quota - used)
  const pct = quota > 0 ? Math.min(100, Math.round((used / quota) * 100)) : 0

  return {
    photos_bytes: photos,
    videos_bytes: videos,
    profile_bytes: profile,
    used_bytes: used,
    quota_bytes: quota,
    remaining_bytes: remaining,
    pct,
  }
}

/**
 * Returns null when `incomingBytes` fits within the remaining quota, or a
 * human-friendly error string when it would exceed it.
 */
export async function checkQuota(
  db: any,
  userId: string,
  incomingBytes: number
): Promise<string | null> {
  const usage = await getStorageUsage(db, userId)
  if (incomingBytes > usage.remaining_bytes) {
    return 'Your storage is full. Delete some photos or videos to free up space, then try again.'
  }
  return null
}
