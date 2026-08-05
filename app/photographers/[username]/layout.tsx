import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import { SITE_NAME, absoluteUrl } from '@/lib/site'

// The public profile page itself is a client component and can't export
// metadata, so this server-component layout wraps it and supplies per-profile
// SEO — unique title, description, canonical, and OG image. These are the
// marketplace's highest-value pages for organic search.

function truncate(text: string, max: number): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trimEnd()}…`
}

export async function generateMetadata(
  { params }: { params: { username: string } }
): Promise<Metadata> {
  const canonical = `/photographers/${params.username}`
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (url && key) {
    try {
      const db = createClient(url, key, { auth: { persistSession: false } }) as any
      const { data: p } = await db
        .from('photographer_profiles')
        .select('display_name, tagline, bio, location, avatar_url, cover_image_url')
        .eq('username', params.username)
        .eq('profile_status', 'approved')
        .maybeSingle()

      if (p) {
        const place = p.location ? ` in ${p.location}` : ' in Edmonton'
        const title = `${p.display_name} — Photographer${p.location ? ` in ${p.location}` : ' in Edmonton'}`
        const description = truncate(
          p.tagline || p.bio ||
            `Book ${p.display_name}, a photographer${place}. View portfolio, packages, and verified reviews on ${SITE_NAME}.`,
          160,
        )
        const ogImage = p.cover_image_url || p.avatar_url || absoluteUrl('/logo.png')

        return {
          title,
          description,
          alternates: { canonical },
          openGraph: {
            title,
            description,
            url: canonical,
            type: 'profile',
            images: [{ url: ogImage, alt: p.display_name }],
          },
          twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [ogImage],
          },
        }
      }
    } catch {
      // fall through to the generic fallback below
    }
  }

  return {
    title: 'Photographer Profile',
    description: `View this photographer's portfolio, packages, and verified reviews on ${SITE_NAME}.`,
    alternates: { canonical },
  }
}

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children
}
