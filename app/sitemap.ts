import type { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'
import { SITE_URL } from '@/lib/site'

// Regenerate the sitemap hourly so newly-approved photographers get discovered
// without a redeploy.
export const revalidate = 3600

// Public, indexable marketing routes and their relative priority.
const STATIC_ROUTES: Array<{ path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }> = [
  { path: '/',                 priority: 1.0, changeFrequency: 'daily' },
  { path: '/photographers',    priority: 0.9, changeFrequency: 'daily' },
  { path: '/how-it-works',     priority: 0.7, changeFrequency: 'monthly' },
  { path: '/for-photographers',priority: 0.7, changeFrequency: 'monthly' },
  { path: '/about',            priority: 0.6, changeFrequency: 'monthly' },
  { path: '/compare',          priority: 0.6, changeFrequency: 'monthly' },
  { path: '/guidelines',       priority: 0.4, changeFrequency: 'yearly' },
  { path: '/contact',          priority: 0.4, changeFrequency: 'yearly' },
  { path: '/privacy',          priority: 0.3, changeFrequency: 'yearly' },
  { path: '/terms',            priority: 0.3, changeFrequency: 'yearly' },
]

async function getPhotographerEntries(): Promise<MetadataRoute.Sitemap> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  // During build (or if env is missing) skip the dynamic section rather than throw.
  if (!url || !key) return []

  try {
    const db = createClient(url, key, { auth: { persistSession: false } }) as any
    const { data } = await db
      .from('photographer_profiles')
      .select('username, updated_at')
      .eq('profile_status', 'approved')
      .not('username', 'is', null)

    return (data ?? []).map((p: any) => ({
      url: `${SITE_URL}/photographers/${p.username}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))
  } catch {
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map(r => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }))

  const photographerEntries = await getPhotographerEntries()
  return [...staticEntries, ...photographerEntries]
}
