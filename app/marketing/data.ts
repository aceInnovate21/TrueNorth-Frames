import type { Badge, BadgeType } from '@/lib/badges'

/**
 * Dummy data for the /marketing demo site.
 *
 * This whole /marketing area is a self-contained, click-through mockup that
 * mirrors the production UI (home, browse, profile, dashboard, booking) with
 * sample data — built so it can be screen-recorded for the launch video.
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

// Real Unsplash photo IDs, one per slot — no ID is reused within a single
// visible screen (a profile's portfolio, or the browse grid). Loads on the
// deployed site the same way the homepage's Unsplash images do.
export const u = (id: string, w: number, h: number) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&q=80&fit=crop&crop=faces`

// 6 distinct cover images (one per photographer)
const COVERS = [
  '1519741497674-611481863552', // wedding
  '1606216794074-735e91aa2c92', // portrait
  '1560250097-0b93528c311a',    // corporate
  '1511285560929-80b456fea0bc', // couple
  '1492684223066-81342ee5ff30', // event
  '1519689680058-324335c77eba', // family
]

// 6 distinct avatar (face) images
const AVATARS = [
  '1500648767791-00dcc994a43e', // man
  '1494790108377-be9c29b29330', // woman
  '1507003211169-0a1dd7228f2d', // man
  '1438761681033-6461ffad8d80', // woman
  '1633332755192-727a05c4013d', // man
  '1544005313-94ddf0286df2',    // woman
]

// Portfolio image pool — 18 distinct; each photographer draws a distinct
// 8-image window so no image repeats inside one profile's gallery.
const POOL = [
  '1519741497674-611481863552', '1606216794074-735e91aa2c92', '1507679799987-c73779587ccf',
  '1511285560929-80b456fea0bc', '1492684223066-81342ee5ff30', '1519689680058-324335c77eba',
  '1583939003579-730e3918a45a', '1521737604893-d14cc237f11d', '1465146344425-f00d5f5c8f07',
  '1470229722913-7c0e2dbbafd1', '1522673607200-164d1b6ce486', '1600585154340-be6161a56a0c',
  '1573496359142-b8d87734a5a2', '1514525253161-7a46d19cd819', '1476703993599-0035a21b17a9',
  '1533174072545-7a4b6ad7a6c3', '1556157382-97eda2d62296', '1502672260266-1c1ef2d93688',
]

function portfolioFor(offset: number, n = 9): string[] {
  return Array.from({ length: n }, (_, i) => POOL[(offset + i) % POOL.length])
}

export type Review = { author: string; initials: string; color: string; rating: number; date: string; text: string }
export type Faq = { q: string; a: string }
export type Pkg = { id: string; name: string; specialty: string; price: string; duration: string; blurb: string; features: string[] }

export type DemoPhotographer = {
  slug: string
  name: string
  initials: string
  tagline: string
  location: string
  specialties: string[]
  rating: number
  reviews: number
  bookings: number
  profileViews: number
  yearsExperience: number
  memberSince: string
  rateDisplay: string
  rateNote: string
  trustScore: number
  badge: BadgeType
  founder: boolean
  availableToday: boolean
  avatarId: string
  coverId: string
  avatarColor: string
  gbp: { rating: number; count: number; verified: boolean; username: string }
  instagram: string
  bio: string
  portfolioIds: string[]
  packages: Pkg[]
  reviewList: Review[]
  faqs: Faq[]
  availability: { date: string; status: 'open' | 'few' | 'booked' }[]
}

function avail(): DemoPhotographer['availability'] {
  const out: DemoPhotographer['availability'] = []
  const base = new Date('2026-06-10')
  const pattern: ('open' | 'few' | 'booked')[] = ['open', 'open', 'few', 'booked', 'open', 'few', 'open']
  for (let i = 0; i < 7; i++) {
    const d = new Date(base); d.setDate(base.getDate() + i)
    out.push({ date: d.toISOString().slice(0, 10), status: pattern[i] })
  }
  return out
}

export const PHOTOGRAPHERS: DemoPhotographer[] = [
  {
    slug: 'jordan-mercer', name: 'Jordan Mercer', initials: 'JM',
    tagline: 'Documentary wedding & portrait photography',
    location: 'Edmonton, AB', specialties: ['Wedding', 'Portrait', 'Events'],
    rating: 4.9, reviews: 127, bookings: 84, profileViews: 3120, yearsExperience: 11,
    memberSince: '2023', rateDisplay: 'From $1,200', rateNote: 'per event · 4h minimum',
    trustScore: 94, badge: 'trusted_pro', founder: true, availableToday: true,
    avatarId: AVATARS[0], coverId: COVERS[0], avatarColor: 'bg-slate-600',
    gbp: { rating: 4.9, count: 214, verified: true, username: 'mercerframes' },
    instagram: 'mercerframes',
    bio: 'I shoot weddings and portraits the documentary way — natural light, honest moments, zero stiff poses. A decade behind the lens across Alberta has taught me that the best photos happen between the planned ones.\n\nEvery booking includes a pre-shoot call, a private online gallery, and a fast turnaround. I only take a limited number of weddings each year so every couple gets my full attention.',
    portfolioIds: portfolioFor(0),
    packages: [
      { id: 'p1', name: 'Elopement', specialty: 'wedding', price: '$1,200', duration: '4 hours', blurb: 'Intimate ceremonies and elopements.', features: ['4 hours coverage', '150 edited photos', 'Online gallery', 'Print release'] },
      { id: 'p2', name: 'Full Wedding', specialty: 'wedding', price: '$3,400', duration: '10 hours', blurb: 'Full-day, two-shooter coverage.', features: ['10 hours · 2 shooters', '600+ edited photos', 'Engagement session', 'Heirloom album'] },
      { id: 'p3', name: 'Portrait Session', specialty: 'portrait', price: '$350', duration: '1 hour', blurb: 'Individual, couple, or family portraits.', features: ['1 hour · 1 location', '40 edited photos', 'Outfit change', 'Online gallery'] },
    ],
    reviewList: [
      { author: 'Emily & Sam', initials: 'ES', color: 'bg-rose-500', rating: 5, date: 'May 2026', text: 'Jordan captured our wedding perfectly. The candid shots are the ones we keep coming back to — you never noticed the camera all day.' },
      { author: 'Daniel R.', initials: 'DR', color: 'bg-indigo-600', rating: 5, date: 'Apr 2026', text: 'Booked a family portrait session and the whole thing was relaxed and fun. Turnaround was faster than promised.' },
      { author: 'Priya K.', initials: 'PK', color: 'bg-teal-600', rating: 4, date: 'Mar 2026', text: 'Beautiful work and easy to communicate with through the app. Would happily book again.' },
    ],
    faqs: [
      { q: 'How far in advance should I book?', a: 'For weddings, 6–9 months is ideal, but I do take last-minute dates when my calendar allows.' },
      { q: 'Do you travel outside Edmonton?', a: 'Yes — anywhere in the greater Edmonton area is included, and I travel further for a small fee.' },
      { q: 'When do we get our photos?', a: 'Portrait galleries land within one week; full weddings within four weeks.' },
    ],
    availability: avail(),
  },
  {
    slug: 'ava-lindqvist', name: 'Ava Lindqvist', initials: 'AL',
    tagline: 'Calm, unhurried newborn & family portraits',
    location: 'Edmonton, AB', specialties: ['Portrait', 'Newborn'],
    rating: 5.0, reviews: 96, bookings: 61, profileViews: 2480, yearsExperience: 7,
    memberSince: '2023', rateDisplay: 'From $300', rateNote: 'per session',
    trustScore: 91, badge: 'most_reviewed', founder: false, availableToday: false,
    avatarId: AVATARS[1], coverId: COVERS[1], avatarColor: 'bg-rose-500',
    gbp: { rating: 5.0, count: 132, verified: true, username: 'avalindqvistphoto' },
    instagram: 'ava.newborn',
    bio: 'Newborn and family sessions made calm and unhurried. I have a home studio in Oliver and also travel across YEG for lifestyle-at-home sessions.\n\nBabies set the pace — I never rush. Sessions include props, wraps, and a gentle, safety-first approach parents can relax into.',
    portfolioIds: portfolioFor(3),
    packages: [
      { id: 'p1', name: 'Newborn Studio', specialty: 'newborn', price: '$450', duration: '2–3 hours', blurb: 'Studio newborn session with props.', features: ['2–3 hours', 'Props & wraps', '25 edited photos', 'Online gallery'] },
      { id: 'p2', name: 'Family Session', specialty: 'portrait', price: '$300', duration: '1 hour', blurb: 'Outdoor family portraits.', features: ['1 hour outdoor', '35 edited photos', 'All ages welcome', 'Print release'] },
    ],
    reviewList: [
      { author: 'Hannah M.', initials: 'HM', color: 'bg-amber-600', rating: 5, date: 'May 2026', text: 'Ava was so patient with our newborn. The photos are stunning and we felt completely at ease the whole time.' },
      { author: 'The Olsens', initials: 'TO', color: 'bg-slate-600', rating: 5, date: 'Apr 2026', text: 'Our family shoot was genuinely fun and the gallery made us cry (happy tears). Highly recommend.' },
    ],
    faqs: [
      { q: 'When should we book a newborn session?', a: 'The first two weeks are ideal, but I photograph newborns up to about six weeks.' },
      { q: 'Do you provide props?', a: 'Yes — wraps, bonnets, baskets, and backdrops are all included.' },
    ],
    availability: avail(),
  },
  {
    slug: 'marcus-cole', name: 'Marcus Cole', initials: 'MC',
    tagline: 'Corporate headshots & real-estate photography',
    location: 'Edmonton, AB', specialties: ['Corporate', 'Real Estate'],
    rating: 4.8, reviews: 58, bookings: 73, profileViews: 1890, yearsExperience: 9,
    memberSince: '2024', rateDisplay: 'From $180', rateNote: 'per shoot',
    trustScore: 88, badge: 'most_booked', founder: false, availableToday: true,
    avatarId: AVATARS[2], coverId: COVERS[2], avatarColor: 'bg-zinc-700',
    gbp: { rating: 4.8, count: 97, verified: true, username: 'colecommercial' },
    instagram: 'cole.commercial',
    bio: 'Corporate headshots, brand shoots, and MLS-ready real-estate photography with fast turnaround and same-day invoicing.\n\nI work with agents, agencies, and teams who need consistent, professional imagery on a schedule. On-site lighting, tethered previews, and next-day delivery are standard.',
    portfolioIds: portfolioFor(6),
    packages: [
      { id: 'p1', name: 'Headshot Day', specialty: 'corporate', price: '$180', duration: '15 min / person', blurb: 'On-site team headshots.', features: ['15 min slots', '3 retouched selects each', 'Consistent lighting', 'Next-day delivery'] },
      { id: 'p2', name: 'Property Shoot', specialty: 'real-estate', price: '$240', duration: 'Up to 2,500 sq ft', blurb: 'MLS-ready property photos.', features: ['30 HDR photos', 'Wide-angle interiors', 'Twilight add-on', 'Next-day delivery'] },
    ],
    reviewList: [
      { author: 'Northgate Realty', initials: 'NR', color: 'bg-indigo-600', rating: 5, date: 'May 2026', text: 'Marcus shoots all our listings now. Reliable, fast, and the photos consistently help homes show better.' },
      { author: 'Lena P.', initials: 'LP', color: 'bg-rose-500', rating: 4, date: 'Mar 2026', text: 'Great corporate headshots for our whole team in one afternoon. Smooth and professional.' },
    ],
    faqs: [
      { q: 'How fast is delivery?', a: 'Real-estate galleries are delivered next day; headshots within 48 hours.' },
      { q: 'Can you shoot our whole team on-site?', a: 'Absolutely — I bring a full mobile lighting setup to your office.' },
    ],
    availability: avail(),
  },
  {
    slug: 'priya-nair', name: 'Priya Nair', initials: 'PN',
    tagline: 'South-Asian weddings & vibrant celebrations',
    location: 'Sherwood Park, AB', specialties: ['Wedding', 'Events'],
    rating: 4.9, reviews: 41, bookings: 29, profileViews: 1440, yearsExperience: 6,
    memberSince: '2024', rateDisplay: 'From $1,600', rateNote: 'per event',
    trustScore: 86, badge: 'verified_pro', founder: false, availableToday: false,
    avatarId: AVATARS[3], coverId: COVERS[3], avatarColor: 'bg-indigo-600',
    gbp: { rating: 4.9, count: 63, verified: true, username: 'priyanairphoto' },
    instagram: 'priya.weds',
    bio: 'South-Asian wedding specialist — multi-day celebrations, big families, and bold colour. I know the rituals and the run-of-show, so nothing important gets missed.\n\nFrom mehndi to reception, I move with your family and capture the energy of the whole celebration.',
    portfolioIds: portfolioFor(9),
    packages: [
      { id: 'p1', name: 'Ceremony', specialty: 'wedding', price: '$1,600', duration: '6 hours', blurb: 'Single-day ceremony coverage.', features: ['6 hours coverage', '300 edited photos', 'Online gallery', 'Print release'] },
      { id: 'p2', name: 'Full Celebration', specialty: 'wedding', price: '$4,200', duration: '2 days', blurb: 'Multi-day celebration coverage.', features: ['2 days · 2 shooters', '800+ edited photos', 'Highlight reel', 'Heirloom album'] },
    ],
    reviewList: [
      { author: 'Anjali & Rohan', initials: 'AR', color: 'bg-amber-600', rating: 5, date: 'May 2026', text: 'Priya understood every ritual without us having to explain. She captured three days of chaos beautifully.' },
      { author: 'Meera S.', initials: 'MS', color: 'bg-teal-600', rating: 5, date: 'Feb 2026', text: 'The colours, the energy, the candids — everything we hoped for. Worth every penny.' },
    ],
    faqs: [
      { q: 'Do you cover multi-day events?', a: 'Yes — my Full Celebration package is built for two-day weddings with a second shooter.' },
      { q: 'Do you provide a highlight reel?', a: 'A short highlight reel is included with the Full Celebration package.' },
    ],
    availability: avail(),
  },
  {
    slug: 'theo-brant', name: 'Theo Brant', initials: 'TB',
    tagline: 'Moody, editorial portraits & events',
    location: 'Edmonton, AB', specialties: ['Portrait', 'Events'],
    rating: 4.7, reviews: 12, bookings: 6, profileViews: 640, yearsExperience: 2,
    memberSince: '2025', rateDisplay: 'From $150', rateNote: 'per session',
    trustScore: 72, badge: 'rising_talent', founder: false, availableToday: true,
    avatarId: AVATARS[4], coverId: COVERS[4], avatarColor: 'bg-teal-600',
    gbp: { rating: 4.7, count: 18, verified: false, username: 'theobrant' },
    instagram: 'theo.brant',
    bio: 'Emerging portrait and event photographer with a moody, editorial edge. I am building my book, so rates are competitive while I do.\n\nI love dramatic light and strong composition — think magazine, not snapshot. Great for creatives, musicians, and brands wanting something with attitude.',
    portfolioIds: portfolioFor(12),
    packages: [
      { id: 'p1', name: 'Creative Portrait', specialty: 'portrait', price: '$150', duration: '45 min', blurb: 'One-look editorial portrait.', features: ['45 min · 1 look', '20 edited photos', 'Studio or location', 'Online gallery'] },
      { id: 'p2', name: 'Event Coverage', specialty: 'events', price: '$400', duration: '3 hours', blurb: 'Editorial event coverage.', features: ['3 hours coverage', '200 photos', '48h delivery', 'Print release'] },
    ],
    reviewList: [
      { author: 'Jae L.', initials: 'JL', color: 'bg-slate-600', rating: 5, date: 'Apr 2026', text: 'Theo has a real eye. The portraits came out looking like an album cover. Can’t wait to shoot again.' },
      { author: 'Marco V.', initials: 'MV', color: 'bg-rose-500', rating: 4, date: 'Mar 2026', text: 'Great value and a genuinely creative approach. A rising talent for sure.' },
    ],
    faqs: [
      { q: 'Do you shoot in a studio?', a: 'Both — I have access to a studio and love location work with dramatic natural light.' },
      { q: 'How soon do I get my photos?', a: 'Portrait galleries are delivered within 48 hours.' },
    ],
    availability: avail(),
  },
  {
    slug: 'sofia-reyes', name: 'Sofia Reyes', initials: 'SR',
    tagline: 'Personal-brand & executive portraiture',
    location: 'St. Albert, AB', specialties: ['Corporate', 'Portrait'],
    rating: 4.9, reviews: 74, bookings: 52, profileViews: 2110, yearsExperience: 8,
    memberSince: '2023', rateDisplay: 'From $220', rateNote: 'per session',
    trustScore: 90, badge: 'trusted_pro', founder: false, availableToday: false,
    avatarId: AVATARS[5], coverId: COVERS[5], avatarColor: 'bg-amber-600',
    gbp: { rating: 4.9, count: 108, verified: true, username: 'sofiareyesstudio' },
    instagram: 'sofia.brand',
    bio: 'Personal-brand and executive portraiture. LinkedIn-ready in an hour, campaign-ready in a day.\n\nI help founders, coaches, and teams show up online with imagery that actually looks like them on their best day. Direction included — you don’t need to know how to pose.',
    portfolioIds: portfolioFor(15),
    packages: [
      { id: 'p1', name: 'Brand Mini', specialty: 'corporate', price: '$220', duration: '30 min', blurb: 'Quick professional refresh.', features: ['30 min · 2 looks', '15 edited photos', 'Headshot + lifestyle', 'Online gallery'] },
      { id: 'p2', name: 'Brand Story', specialty: 'corporate', price: '$600', duration: '2 hours', blurb: 'Full personal-brand shoot.', features: ['2 hours · 4 looks', '60 edited photos', 'Lifestyle + headshots', 'Usage rights'] },
    ],
    reviewList: [
      { author: 'Grace T.', initials: 'GT', color: 'bg-indigo-600', rating: 5, date: 'May 2026', text: 'Sofia made me feel comfortable in front of the camera for the first time ever. My brand photos finally look like me.' },
      { author: 'Kofi A.', initials: 'KA', color: 'bg-teal-600', rating: 5, date: 'Apr 2026', text: 'Fast, professional, and the direction was excellent. Our whole leadership team looks sharp now.' },
    ],
    faqs: [
      { q: 'I’m awkward on camera — can you help?', a: 'That’s most of my clients. I direct every shot, so you never have to guess how to pose.' },
      { q: 'Do I get usage rights for marketing?', a: 'Yes — the Brand Story package includes full commercial usage rights.' },
    ],
    availability: avail(),
  },
]

export function getPhotographer(slug: string) {
  return PHOTOGRAPHERS.find((p) => p.slug === slug)
}
