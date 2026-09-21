'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useRef, useState } from 'react'
import { Send, CheckCheck, CalendarCheck, Phone, Video } from 'lucide-react'
import { PHOTOGRAPHERS, getPhotographer, type DemoPhotographer } from '../data'
import { SiteNav } from '../site-nav'

type Msg = { id: number; from: 'me' | 'them'; text: string; time: string }

const SEED: Record<string, Msg[]> = {
  'jordan-mercer': [
    { id: 1, from: 'them', text: 'Hey! Thanks for reaching out 👋 What date are you thinking?', time: '9:41 AM' },
    { id: 2, from: 'me', text: 'Hi Jordan! We’re planning a June 18 wedding at the Muttart. Are you free?', time: '9:43 AM' },
    { id: 3, from: 'them', text: 'June 18 is open! I love the Muttart — the light through the pyramids is unreal. Want me to send a package?', time: '9:44 AM' },
  ],
  'ava-lindqvist': [
    { id: 1, from: 'them', text: 'Hi there! Congratulations on the little one 🍼', time: 'Yesterday' },
    { id: 2, from: 'me', text: 'Thank you! Looking for a newborn studio session in a few weeks.', time: 'Yesterday' },
  ],
}

function now() {
  return new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

function MessagesInner() {
  const params = useSearchParams()
  const to = params.get('to') ?? 'jordan-mercer'
  const [activeSlug, setActiveSlug] = useState(to)
  const active = getPhotographer(activeSlug) ?? PHOTOGRAPHERS[0]

  const [threads, setThreads] = useState<Record<string, Msg[]>>(() => ({ ...SEED }))
  const [draft, setDraft] = useState('')
  const [typing, setTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const msgs = threads[active.slug] ?? []

  useEffect(() => { setActiveSlug(to) }, [to])
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [msgs.length, typing])

  const send = () => {
    const text = draft.trim()
    if (!text) return
    setThreads((t) => ({ ...t, [active.slug]: [...(t[active.slug] ?? []), { id: Date.now(), from: 'me', text, time: now() }] }))
    setDraft('')
    setTyping(true)
    setTimeout(() => {
      setThreads((t) => ({
        ...t,
        [active.slug]: [...(t[active.slug] ?? []), { id: Date.now() + 1, from: 'them', text: replyFor(active), time: now() }],
      }))
      setTyping(false)
    }, 1400)
  }

  return (
    <>
    <SiteNav />
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="text-2xl font-semibold tracking-tight mb-4">Messages</h1>
      <div className="grid md:grid-cols-[300px_1fr] gap-4 bg-white ring-1 ring-ink-100 rounded-2xl overflow-hidden shadow-sm" style={{ height: 'min(72vh, 640px)' }}>
        {/* Conversation list */}
        <aside className="border-r border-ink-100 overflow-y-auto hidden md:block">
          {PHOTOGRAPHERS.map((p) => {
            const last = (threads[p.slug] ?? [])[ (threads[p.slug]?.length ?? 1) - 1 ]
            return (
              <button
                key={p.slug}
                onClick={() => setActiveSlug(p.slug)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left border-b border-ink-50 transition-colors ${p.slug === active.slug ? 'bg-ink-50' : 'hover:bg-ink-50/60'}`}
              >
                <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${p.avatarColor}`}>{p.initials}</span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between">
                    <span className="font-semibold text-sm truncate">{p.name}</span>
                    {p.availableToday && <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />}
                  </span>
                  <span className="text-xs text-ink-400 truncate block">{last?.text ?? 'Start a conversation'}</span>
                </span>
              </button>
            )
          })}
        </aside>

        {/* Thread */}
        <section className="flex flex-col min-h-0">
          <header className="flex items-center gap-3 px-4 py-3 border-b border-ink-100">
            <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold ${active.avatarColor}`}>{active.initials}</span>
            <div className="min-w-0">
              <Link href={`/marketing/photographer/${active.slug}`} className="font-semibold text-sm hover:underline">{active.name}</Link>
              <p className="text-[11px] text-emerald-600 font-medium">● Online now</p>
            </div>
            <div className="ml-auto flex items-center gap-1 text-ink-300">
              <button className="w-8 h-8 rounded-lg hover:bg-ink-50 flex items-center justify-center"><Phone className="w-4 h-4" /></button>
              <button className="w-8 h-8 rounded-lg hover:bg-ink-50 flex items-center justify-center"><Video className="w-4 h-4" /></button>
            </div>
          </header>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-ink-50/40">
            {msgs.map((m) => (
              <div key={m.id} className={`flex ${m.from === 'me' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-sm ${m.from === 'me' ? 'bg-ink text-white rounded-br-sm' : 'bg-white ring-1 ring-ink-100 text-ink-700 rounded-bl-sm'}`}>
                  <p>{m.text}</p>
                  <span className={`flex items-center gap-1 justify-end mt-1 text-[10px] ${m.from === 'me' ? 'text-white/50' : 'text-ink-300'}`}>
                    {m.time} {m.from === 'me' && <CheckCheck className="w-3 h-3" />}
                  </span>
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex justify-start">
                <div className="bg-white ring-1 ring-ink-100 rounded-2xl rounded-bl-sm px-4 py-3">
                  <span className="flex gap-1">
                    <Dot /> <Dot delay="0.15s" /> <Dot delay="0.3s" />
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="px-3 py-3 border-t border-ink-100">
            <Link href={`/marketing/book?to=${active.slug}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-600 bg-ink-50 hover:bg-ink-100 px-3 py-1.5 rounded-full mb-2 transition-colors">
              <CalendarCheck className="w-3.5 h-3.5" /> Send a booking request
            </Link>
            <div className="flex items-center gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
                placeholder={`Message ${active.name.split(' ')[0]}…`}
                className="flex-1 text-sm bg-ink-50 rounded-full px-4 py-2.5 outline-none focus:ring-2 focus:ring-ink/10 placeholder:text-ink-300"
              />
              <button onClick={send} disabled={!draft.trim()} className="w-10 h-10 rounded-full bg-ink text-white flex items-center justify-center disabled:opacity-40 transition-opacity">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
    </>
  )
}

function Dot({ delay = '0s' }: { delay?: string }) {
  return <span className="w-1.5 h-1.5 rounded-full bg-ink-300 animate-bounce" style={{ animationDelay: delay }} />
}

function replyFor(p: DemoPhotographer): string {
  const options = [
    `Sounds great — I’ll hold that date for you. Want to lock it in with a booking request?`,
    `Love it. I’ll put together a quick quote based on your ${p.specialties[0].toLowerCase()} package.`,
    `Perfect, that works on my end! Send the booking request and I’ll confirm right away. 📸`,
  ]
  return options[Math.floor(Math.random() * options.length)]
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="max-w-6xl mx-auto px-6 py-10 text-ink-400">Loading…</div>}>
      <MessagesInner />
    </Suspense>
  )
}
