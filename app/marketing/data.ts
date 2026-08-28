import type { Badge, BadgeType } from '@/lib/badges'

/**
 * Dummy data for the /marketing demo site.
 *
 * This whole /marketing area is a self-contained, click-through mockup with no
 * backend — built so it can be screen-recorded for the product launch video.
 * Nothing here touches Supabase, auth, or the real photographer tables.
 */

export const SPECIALTIES = [
  'Wedding', 'Portrait', 'Corporate', 'Real Estate', 'Events', 'Newborn',
] as const

const BADGE_LOOKS: Record<BadgeType, Omit<Badge, 'type' | 'description'>> = {
  most_reviewed: { label: 'Most Reviewed', color: 'bg-purple-50', textColor: 'text-purple-700', borderColor: 'border-purple-200', emoji: '🏆' },
  most_booked:   { label: 'Most Booked',   color: 'bg-pink-50',   textColor: 'text-pink-700',   borderColor: 'border-pink-200',   emoji: '📅' },
  trusted_pro:   { label: 'Trusted Pro',   color: 'bg-emerald-50', textColor: 'text-emerald-700', borderColor: 'border-emerald-200', emoji: '✅' },
  verified_pro:  { label: 'Verified Pro',  color: 'bg-blue-50',   textColor: 'text-blue-700',   borderColor: 'border-blue-200',   emoji: '🔵' },
  rising_talent: { label: 'Rising Talent', color: 'bg-amber-50',  textColor: 'text-amber-700',  borderColor: 'border-amber-200',  emoji: '🌟' },
  newly_joined:  { label: 'Newly Joined',  color: 'bg-ink-50',    textColor: 'text-ink-500',    borderColor: 'border-ink-100',    emoji: '👋' },
}

export function makeBadge(type: BadgeType): Badge {
  return { type, description: '', ...BADGE_LOOKS[type] }
}

// Only Unsplash photo IDs proven to resolve in the app (see app/page.tsx),
// reused at different crops so the demo never shows a broken image.
const P = {
  wedding:   '1519741497674-611481863552',
  portrait:  '1606216794074-735e91aa2c92',
  corporate: '1507679799987-c73779587ccf',
}
export const img = (id: string, w = 600, h?: number) =>
  `https://images.unsplash.com/photo-${id}?w=${w}${h ? `&h=${h}` : ''}&q=80&fit=crop&crop=faces`

export type DemoPhotographer = {
  slug: string
  name: string
  initials: string
  location: string
  specialties: string[]
  rating: number
  reviews: number
  bookings: number
  trustScore: number
  badge: BadgeType
  availableToday: boolean
  cover: string
  avatarColor: string
  bio: string
  portfolio: string[]
  packages: { name: string; price: string; blurb: string }[]
}

const cover = (id: string) => img(id, 800, 520)
const tile = (id: string, n: number) => img(id, 400, 400) + `&sig=${n}`

export const PHOTOGRAPHERS: DemoPhotographer[] = [
  {
    slug: 'jordan-mercer', name: 'Jordan Mercer', initials: 'JM', location: 'Edmonton, AB',
    specialties: ['Wedding', 'Portrait', 'Events'], rating: 4.9, reviews: 127, bookings: 84,
    trustScore: 94, badge: 'trusted_pro', availableToday: true, cover: cover(P.wedding),
    avatarColor: 'bg-slate-600',
    bio: 'Documentary-style wedding & portrait photographer with a decade behind the lens across Alberta. Natural light, honest moments, zero stiff poses.',
    portfolio: [tile(P.wedding, 1), tile(P.portrait, 2), tile(P.corporate, 3), tile(P.wedding, 4), tile(P.portrait, 5), tile(P.corporate, 6)],
    packages: [
      { name: 'Elopement', price: '$1,200', blurb: '4 hours · 150 edited photos · online gallery' },
      { name: 'Full Wedding', price: '$3,400', blurb: '10 hours · 2 shooters · 600+ photos · album' },
      { name: 'Portrait Session', price: '$350', blurb: '1 hour · 1 location · 40 edited photos' },
    ],
  },
  {
    slug: 'ava-lindqvist', name: 'Ava Lindqvist', initials: 'AL', location: 'Edmonton, AB',
    specialties: ['Portrait', 'Newborn'], rating: 5.0, reviews: 96, bookings: 61,
    trustScore: 91, badge: 'most_reviewed', availableToday: false, cover: cover(P.portrait),
    avatarColor: 'bg-rose-500',
    bio: 'Newborn & family portraits made calm and unhurried. Studio in Oliver, home sessions across YEG.',
    portfolio: [tile(P.portrait, 7), tile(P.wedding, 8), tile(P.portrait, 9), tile(P.corporate, 10), tile(P.portrait, 11), tile(P.wedding, 12)],
    packages: [
      { name: 'Newborn Studio', price: '$450', blurb: '2–3 hours · props & wraps · 25 edited photos' },
      { name: 'Family Session', price: '$300', blurb: '1 hour · outdoor · 35 edited photos' },
    ],
  },
  {
    slug: 'marcus-cole', name: 'Marcus Cole', initials: 'MC', location: 'Edmonton, AB',
    specialties: ['Corporate', 'Real Estate'], rating: 4.8, reviews: 58, bookings: 73,
    trustScore: 88, badge: 'most_booked', availableToday: true, cover: cover(P.corporate),
    avatarColor: 'bg-zinc-700',
    bio: 'Corporate headshots, brand shoots, and MLS-ready real-estate photography. Fast turnaround, invoices same day.',
    portfolio: [tile(P.corporate, 13), tile(P.wedding, 14), tile(P.corporate, 15), tile(P.portrait, 16), tile(P.corporate, 17), tile(P.wedding, 18)],
    packages: [
      { name: 'Headshot Day', price: '$180', blurb: '15 min slots · 3 retouched selects each' },
      { name: 'Property Shoot', price: '$240', blurb: 'Up to 2,500 sq ft · 30 HDR photos · next day' },
    ],
  },
  {
    slug: 'priya-nair', name: 'Priya Nair', initials: 'PN', location: 'Sherwood Park, AB',
    specialties: ['Wedding', 'Events'], rating: 4.9, reviews: 41, bookings: 29,
    trustScore: 86, badge: 'verified_pro', availableToday: false, cover: cover(P.wedding),
    avatarColor: 'bg-indigo-600',
    bio: 'South-Asian wedding specialist — multi-day celebrations, big families, bold colour. I know the rituals and the run-of-show.',
    portfolio: [tile(P.wedding, 19), tile(P.portrait, 20), tile(P.wedding, 21), tile(P.corporate, 22), tile(P.portrait, 23), tile(P.corporate, 24)],
    packages: [
      { name: 'Ceremony', price: '$1,600', blurb: '6 hours · 300 photos · online gallery' },
      { name: 'Full Celebration', price: '$4,200', blurb: '2 days · 2 shooters · album · highlight reel' },
    ],
  },
  {
    slug: 'theo-brant', name: 'Theo Brant', initials: 'TB', location: 'Edmonton, AB',
    specialties: ['Portrait', 'Events'], rating: 4.7, reviews: 12, bookings: 6,
    trustScore: 72, badge: 'rising_talent', availableToday: true, cover: cover(P.portrait),
    avatarColor: 'bg-teal-600',
    bio: 'Emerging portrait & event photographer with a moody, editorial edge. Building my book — competitive rates while I do.',
    portfolio: [tile(P.portrait, 25), tile(P.corporate, 26), tile(P.wedding, 27), tile(P.portrait, 28), tile(P.corporate, 29), tile(P.wedding, 30)],
    packages: [
      { name: 'Creative Portrait', price: '$150', blurb: '45 min · 1 look · 20 edited photos' },
      { name: 'Event Coverage', price: '$400', blurb: '3 hours · 200 photos · 48h delivery' },
    ],
  },
  {
    slug: 'sofia-reyes', name: 'Sofia Reyes', initials: 'SR', location: 'St. Albert, AB',
    specialties: ['Corporate', 'Portrait'], rating: 4.9, reviews: 74, bookings: 52,
    trustScore: 90, badge: 'trusted_pro', availableToday: false, cover: cover(P.corporate),
    avatarColor: 'bg-amber-600',
    bio: 'Personal-brand and executive portraiture. LinkedIn-ready in an hour, campaign-ready in a day.',
    portfolio: [tile(P.corporate, 31), tile(P.portrait, 32), tile(P.wedding, 33), tile(P.corporate, 34), tile(P.portrait, 35), tile(P.corporate, 36)],
    packages: [
      { name: 'Brand Mini', price: '$220', blurb: '30 min · 15 edited photos · 2 looks' },
      { name: 'Brand Story', price: '$600', blurb: '2 hours · 60 photos · lifestyle + headshots' },
    ],
  },
]

export function getPhotographer(slug: string) {
  return PHOTOGRAPHERS.find((p) => p.slug === slug)
}
