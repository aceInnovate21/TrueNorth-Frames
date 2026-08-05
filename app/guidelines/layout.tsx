import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Community Guidelines',
  description:
    'Community guidelines for clients and photographers on TrueNorth Frames — how we keep the Edmonton photography marketplace trusted and safe.',
  alternates: { canonical: '/guidelines' },
}

export default function GuidelinesLayout({ children }: { children: React.ReactNode }) {
  return children
}
