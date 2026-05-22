import { cache } from 'react'
import { PLATFORM_CONFIG } from './platform-config'

export type PlatformConfig = typeof PLATFORM_CONFIG

// Server-side only — fetches live values from DB via /api/config.
// React `cache()` deduplicates calls within a single request.
// Next.js `fetch` with revalidate:300 deduplicates across requests (edge cache).
export const getPlatformConfig = cache(async (): Promise<PlatformConfig> => {
  try {
    const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
    const res = await fetch(`${base}/api/config`, {
      next: { revalidate: 300 },
    })

    if (!res.ok) throw new Error('config fetch failed')

    const data = await res.json()

    // Merge DB values over static defaults so any missing key still has a value
    return { ...PLATFORM_CONFIG, ...data } as PlatformConfig
  } catch {
    // Fallback to static values if DB is unreachable
    return PLATFORM_CONFIG as unknown as PlatformConfig
  }
})
