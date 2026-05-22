'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, CheckCircle2, User, MapPin, Camera, Bell,
  AlertCircle, Save, ChevronRight, Lock, LogOut, Trash2,
} from 'lucide-react'

import { PLATFORM_CONFIG } from '@/lib/platform-config'
import { supabase } from '@/lib/supabase'

const EDMONTON_AREAS = [
  'Downtown', 'Oliver', 'Glenora', 'Westmount', 'Strathcona',
  'Bonnie Doon', 'Millwoods', 'Windermere', 'St. Albert', 'Sherwood Park',
  'West Edmonton', 'North Edmonton', 'South Edmonton', 'Other',
]

const PHOTOGRAPHY_INTERESTS = [
  'Wedding', 'Portrait', 'Corporate', 'Newborn', 'Family', 'Event',
  'Real Estate', 'Product', 'Boudoir', 'Sports', 'Food', 'Travel',
]

type SaveState = 'idle' | 'saving' | 'saved'

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  )
}

function SectionCard({ id, title, icon: Icon, children }: {
  id: string
  title: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  return (
    <div id={id} className="bg-white rounded-2xl p-6 scroll-mt-24"
      style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04)' }}>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 bg-ink-50 rounded-xl flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-ink-400" />
        </div>
        <h2 className="font-semibold text-ink text-base">{title}</h2>
      </div>
      {children}
    </div>
  )
}

function SaveButton({ state, onClick }: { state: SaveState; onClick: () => void }) {
  return (
    <button onClick={onClick} disabled={state === 'saving'}
      className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl transition-all ${
        state === 'saved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
        : state === 'saving' ? 'bg-ink-50 text-ink-400 cursor-not-allowed border border-ink-100'
        : 'bg-ink text-white hover:bg-ink-800'
      }`}
    >
      {state === 'saved' ? <><CheckCircle2 className="w-4 h-4" /> Saved</>
       : state === 'saving' ? <><Spinner /> Saving…</>
       : <><Save className="w-4 h-4" /> Save changes</>}
    </button>
  )
}

export default function ClientEditProfilePage() {
  const router = useRouter()
  // Profile fields
  const [firstName, setFirstName] = useState('Alex')
  const [lastName, setLastName] = useState('Johnson')
  const [email, setEmail] = useState('alex@example.com')
  const [area, setArea] = useState('Oliver')
  const [customArea, setCustomArea] = useState('')
  const [bio, setBio] = useState('')
  const [interests, setInterests] = useState<string[]>(['Wedding', 'Portrait'])

  // Password change
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')

  // Notification prefs
  const [notifs, setNotifs] = useState({
    bookingUpdates: true,
    newMessages: true,
    reviewReminders: true,
    marketingEmails: false,
  })

  // Save states
  const [saveStates, setSaveStates] = useState<Record<string, SaveState>>({
    profile: 'idle',
    password: 'idle',
    notifications: 'idle',
  })
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [pwError, setPwError] = useState('')

  function touch(f: string) { setTouched(t => ({ ...t, [f]: true })) }

  async function saveSection(key: string, validate?: () => boolean) {
    if (validate && !validate()) return
    clearTimeout(timers.current[key])
    setSaveStates(s => ({ ...s, [key]: 'saving' }))
    await new Promise(r => setTimeout(r, 800))
    setSaveStates(s => ({ ...s, [key]: 'saved' }))
    timers.current[key] = setTimeout(() => setSaveStates(s => ({ ...s, [key]: 'idle' })), 2500)
  }

  function savePassword() {
    setPwError('')
    if (!currentPw) { setPwError('Enter your current password'); return }
    if (newPw.length < 8) { setPwError('New password must be at least 8 characters'); return }
    if (newPw !== confirmPw) { setPwError('Passwords do not match'); return }
    saveSection('password')
    setCurrentPw(''); setNewPw(''); setConfirmPw('')
  }

  function toggleInterest(s: string) {
    setInterests(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : prev.length < 6 ? [...prev, s] : prev
    )
  }

  function toggleNotif(key: keyof typeof notifs) {
    setNotifs(n => ({ ...n, [key]: !n[key] }))
  }

  const bioMax = PLATFORM_CONFIG.max_client_bio_length
  const firstNameErr = touched.firstName && !firstName.trim() ? 'First name is required' : ''
  const emailErr = touched.email && !email.includes('@') ? 'Enter a valid email' : ''

  const NAV_SECTIONS = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'interests', label: 'Interests', icon: Camera },
    { id: 'password', label: 'Password', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ]

  return (
    <div className="min-h-screen bg-ink-50">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white border-b border-ink-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Link href="/dashboard/client" className="p-2 rounded-lg hover:bg-ink-50 transition-colors text-ink-400 hover:text-ink">
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <Link href="/" className="flex items-center gap-2">
                <Image src="/logo.png" alt="TrueNorth Frames" width={28} height={28} className="rounded-md" />
                <span className="font-semibold text-ink text-sm hidden sm:block">TrueNorth Frames</span>
              </Link>
            </div>
            <p className="text-xs text-ink-300 hidden sm:block">Account settings</p>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="font-serif text-2xl font-bold text-ink mb-1">Account settings</h1>
          <p className="text-ink-300 text-sm">Manage your profile, preferences and security.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar nav */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-4 sticky top-24"
              style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04)' }}>
              <p className="text-xs font-semibold uppercase tracking-widest text-ink-300 mb-3 px-2">Sections</p>
              <nav className="space-y-0.5">
                {NAV_SECTIONS.map(item => {
                  const Icon = item.icon
                  return (
                    <a key={item.id} href={`#${item.id}`}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-ink-50 transition-colors group text-ink-500 hover:text-ink">
                      <Icon className="w-4 h-4 text-ink-300 group-hover:text-ink-400" />
                      <span className="text-sm">{item.label}</span>
                    </a>
                  )
                })}
              </nav>
              <div className="mt-4 pt-4 border-t border-ink-50 space-y-0.5">
                <Link href="/dashboard/client"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-ink-50 transition-colors group text-ink-500 hover:text-ink">
                  <ArrowLeft className="w-4 h-4 text-ink-300 group-hover:text-ink-400" />
                  <span className="text-sm">Back to dashboard</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">

            {/* ── Profile ───────────────────────────────────────────────── */}
            <SectionCard id="profile" title="Profile" icon={User}>
              {/* Avatar placeholder */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-ink flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                  {firstName ? firstName[0].toUpperCase() : 'A'}
                </div>
                <div>
                  <p className="text-sm font-medium text-ink">{firstName} {lastName}</p>
                  <p className="text-xs text-ink-300 mt-0.5">Client since May 2026</p>
                  <button className="text-xs text-ink-400 hover:text-ink underline underline-offset-2 mt-1 transition-colors">
                    Change photo
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">First name</label>
                  <input type="text" value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    onBlur={() => touch('firstName')}
                    className={`w-full border rounded-xl px-4 py-3 text-sm text-ink placeholder-ink-200 outline-none focus:ring-2 transition-all ${
                      firstNameErr ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-ink-100 focus:border-ink focus:ring-ink/10'
                    }`}
                  />
                  {firstNameErr && <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600"><AlertCircle className="w-3 h-3" />{firstNameErr}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">Last name</label>
                  <input type="text" value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    className="w-full border border-ink-100 rounded-xl px-4 py-3 text-sm text-ink placeholder-ink-200 outline-none focus:border-ink focus:ring-2 focus:ring-ink/10 transition-all"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-ink mb-1.5">Email address</label>
                <input type="email" value={email}
                  onChange={e => setEmail(e.target.value)}
                  onBlur={() => touch('email')}
                  className={`w-full border rounded-xl px-4 py-3 text-sm text-ink placeholder-ink-200 outline-none focus:ring-2 transition-all ${
                    emailErr ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-ink-100 focus:border-ink focus:ring-ink/10'
                  }`}
                />
                {emailErr && <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600"><AlertCircle className="w-3 h-3" />{emailErr}</p>}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-ink mb-1.5">
                  <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-ink-300" />Your area</span>
                </label>
                <p className="text-xs text-ink-300 mb-2.5">Used to show you local photographers first.</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {EDMONTON_AREAS.map(a => (
                    <button key={a} type="button" onClick={() => setArea(a === 'Other' ? 'other' : a)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                        area === a || (area === 'other' && a === 'Other')
                          ? 'bg-ink text-white border-ink' : 'bg-white text-ink-500 border-ink-100 hover:border-ink-300'
                      }`}>
                      {a}
                    </button>
                  ))}
                </div>
                {area === 'other' && (
                  <input type="text" placeholder="Enter your city or area" value={customArea}
                    onChange={e => setCustomArea(e.target.value)}
                    className="w-full border border-ink-100 rounded-xl px-4 py-3 text-sm text-ink placeholder-ink-200 outline-none focus:border-ink focus:ring-2 focus:ring-ink/10 transition-all"
                    autoFocus
                  />
                )}
              </div>

              <div className="mb-5">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-ink">Short bio <span className="text-ink-300 font-normal">(optional)</span></label>
                  <span className={`text-xs ${bio.length >= bioMax ? 'text-red-500' : bio.length > bioMax - 60 ? 'text-amber-500' : 'text-ink-300'}`}>{bio.length}/{bioMax}</span>
                </div>
                <textarea rows={3} value={bio} onChange={e => { if (e.target.value.length <= bioMax) setBio(e.target.value) }} maxLength={bioMax}
                  placeholder="Tell photographers a little about yourself — the type of sessions you're looking for, your style, etc."
                  className="w-full border border-ink-100 rounded-xl px-4 py-3 text-sm text-ink placeholder-ink-200 outline-none focus:border-ink focus:ring-2 focus:ring-ink/10 transition-all resize-none"
                />
              </div>

              <div className="flex justify-end">
                <SaveButton state={saveStates.profile} onClick={() => saveSection('profile')} />
              </div>
            </SectionCard>

            {/* ── Photography interests ─────────────────────────────────── */}
            <SectionCard id="interests" title="Photography interests" icon={Camera}>
              <p className="text-xs text-ink-300 mb-4">Select up to 6. We use these to personalise photographer recommendations for you.</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {PHOTOGRAPHY_INTERESTS.map(s => {
                  const selected = interests.includes(s)
                  const maxed = !selected && interests.length >= 6
                  return (
                    <button key={s} type="button" onClick={() => toggleInterest(s)} disabled={maxed}
                      className={`text-sm px-4 py-2 rounded-xl border transition-all ${
                        selected ? 'bg-ink text-white border-ink'
                        : maxed ? 'bg-white text-ink-200 border-ink-100 cursor-not-allowed'
                        : 'bg-white text-ink-500 border-ink-100 hover:border-ink-300 hover:text-ink'
                      }`}>
                      {s}
                    </button>
                  )
                })}
              </div>
              {interests.length > 0 && (
                <div className="bg-ink-50 rounded-xl px-4 py-3 mb-4">
                  <p className="text-xs text-ink-400">Selected: <span className="font-medium text-ink">{interests.join(', ')}</span></p>
                </div>
              )}
              {interests.length === 6 && (
                <p className="text-xs text-amber-600 flex items-center gap-1.5 mb-4">
                  <AlertCircle className="w-3 h-3" />Maximum 6 interests. Remove one to add another.
                </p>
              )}
              <div className="flex justify-end">
                <SaveButton state={saveStates.profile} onClick={() => saveSection('profile')} />
              </div>
            </SectionCard>

            {/* ── Password ─────────────────────────────────────────────── */}
            <SectionCard id="password" title="Change password" icon={Lock}>
              <div className="space-y-4 mb-5">
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">Current password</label>
                  <input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full border border-ink-100 rounded-xl px-4 py-3 text-sm text-ink placeholder-ink-200 outline-none focus:border-ink focus:ring-2 focus:ring-ink/10 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">New password</label>
                  <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full border border-ink-100 rounded-xl px-4 py-3 text-sm text-ink placeholder-ink-200 outline-none focus:border-ink focus:ring-2 focus:ring-ink/10 transition-all"
                  />
                  {newPw.length > 0 && (
                    <div className="mt-2 flex gap-1">
                      {[4, 6, 8, 10].map(len => (
                        <div key={len} className={`flex-1 h-1 rounded-full ${newPw.length >= len ? 'bg-ink' : 'bg-ink-100'}`} />
                      ))}
                      <span className="text-[10px] text-ink-300 ml-2">
                        {newPw.length < 6 ? 'Weak' : newPw.length < 8 ? 'Fair' : newPw.length < 10 ? 'Good' : 'Strong'}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">Confirm new password</label>
                  <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                    placeholder="Repeat new password"
                    className={`w-full border rounded-xl px-4 py-3 text-sm text-ink placeholder-ink-200 outline-none focus:ring-2 transition-all ${
                      confirmPw && newPw !== confirmPw ? 'border-red-300 focus:ring-red-100' : 'border-ink-100 focus:border-ink focus:ring-ink/10'
                    }`}
                  />
                  {confirmPw && newPw === confirmPw && (
                    <p className="mt-1.5 flex items-center gap-1 text-xs text-emerald-600"><CheckCircle2 className="w-3 h-3" />Passwords match</p>
                  )}
                </div>
              </div>
              {pwError && (
                <p className="flex items-center gap-1.5 text-xs text-red-600 mb-4"><AlertCircle className="w-3 h-3" />{pwError}</p>
              )}
              {saveStates.password === 'saved' && (
                <p className="flex items-center gap-1.5 text-xs text-emerald-600 mb-4"><CheckCircle2 className="w-3 h-3" />Password updated successfully.</p>
              )}
              <div className="flex justify-end">
                <SaveButton state={saveStates.password} onClick={savePassword} />
              </div>
            </SectionCard>

            {/* ── Notifications ────────────────────────────────────────── */}
            <SectionCard id="notifications" title="Notification preferences" icon={Bell}>
              <div className="space-y-4 mb-5">
                {([
                  { key: 'bookingUpdates', label: 'Booking updates', desc: 'Approved, rejected or changes to your booking requests' },
                  { key: 'newMessages', label: 'New messages', desc: 'When a photographer replies to your enquiry' },
                  { key: 'reviewReminders', label: 'Review reminders', desc: 'Reminders to leave a review after a session' },
                  { key: 'marketingEmails', label: 'Promotions & tips', desc: 'Seasonal offers, photography tips and platform news' },
                ] as { key: keyof typeof notifs; label: string; desc: string }[]).map(item => (
                  <div key={item.key} className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-ink">{item.label}</p>
                      <p className="text-xs text-ink-300 mt-0.5">{item.desc}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleNotif(item.key)}
                      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 mt-0.5 ${notifs[item.key] ? 'bg-ink' : 'bg-ink-200'}`}
                      role="switch"
                      aria-checked={notifs[item.key]}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${notifs[item.key] ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex justify-end">
                <SaveButton state={saveStates.notifications} onClick={() => saveSection('notifications')} />
              </div>
            </SectionCard>

            {/* ── Danger zone ──────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl p-6 border border-red-100"
              style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
              <h2 className="font-semibold text-ink mb-1">Danger zone</h2>
              <p className="text-xs text-ink-300 mb-5">These actions cannot be undone. Please be certain before proceeding.</p>
              <div className="flex flex-wrap gap-3">
                <button className="flex items-center gap-2 text-sm font-medium text-red-600 border border-red-200 px-4 py-2.5 rounded-xl hover:bg-red-50 transition-colors">
                  <Trash2 className="w-4 h-4" />Delete account
                </button>
                <button
                  onClick={async () => { await supabase.auth.signOut(); router.push('/login') }}
                  className="flex items-center gap-2 text-sm font-medium text-ink-400 border border-ink-100 px-4 py-2.5 rounded-xl hover:bg-ink-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />Sign out
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
