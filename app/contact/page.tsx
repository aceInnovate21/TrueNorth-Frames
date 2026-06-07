'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, CheckCircle2, AlertCircle, Mail, MessageSquare, Wrench, CreditCard, HelpCircle, Send } from 'lucide-react'
import { Nav } from '@/components/nav'
import { Footer } from '@/components/footer'

const SUBJECTS = [
  { value: 'technical', label: 'Technical issue', icon: Wrench, desc: 'Bug, error, or something not working' },
  { value: 'account',   label: 'Account help',   icon: Mail,    desc: 'Login, profile, or account access' },
  { value: 'billing',   label: 'Billing',         icon: CreditCard, desc: 'Payments or subscription questions' },
  { value: 'general',   label: 'General question', icon: HelpCircle, desc: 'Anything else' },
]

export default function ContactPage() {
  const [name, setName]       = useState('')
  const [email, setEmail]     = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  function touch(f: string) { setTouched(t => ({ ...t, [f]: true })) }

  const valid = name.trim() && email.includes('@') && subject && message.trim().length >= 20

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setTouched({ name: true, email: true, subject: true, message: true })
    if (!valid) return
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), subject, message: message.trim() }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? 'Something went wrong')
      }
      setSuccess(true)
    } catch (err: any) {
      setError(err.message ?? 'Failed to send. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <>
        <Nav />
        <div className="min-h-[80vh] bg-ink-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl p-10 max-w-md w-full text-center"
            style={{ boxShadow: '0 4px 6px rgba(0,0,0,0.04), 0 16px 40px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.05)' }}>
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-ink mb-2">Message sent!</h2>
            <p className="text-ink-400 text-sm leading-relaxed mb-6">
              We've received your message and will get back to you at <span className="font-medium text-ink">{email}</span> within 1–2 business days.
            </p>
            <Link href="/"
              className="inline-flex items-center gap-2 bg-ink text-white font-semibold text-sm px-6 py-3 rounded-xl hover:bg-ink-800 transition-colors">
              Back to home
            </Link>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Nav />

      <div className="bg-ink-50 min-h-screen">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">

          {/* Back */}
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-ink rounded-xl flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <h1 className="font-serif text-3xl font-bold text-ink">Contact & Support</h1>
            </div>
            <p className="text-ink-400 text-sm leading-relaxed">
              Having an issue or a question? Fill out the form and we'll get back to you within 1–2 business days.
            </p>
          </div>

          {/* Form card */}
          <div className="bg-white rounded-2xl p-6 sm:p-8"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 6px 20px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.05)' }}>

            <form onSubmit={handleSubmit} noValidate className="space-y-6">

              {/* Name + Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">
                    Your name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onBlur={() => touch('name')}
                    placeholder="Jane Smith"
                    className={`w-full border rounded-xl px-4 py-3 text-sm text-ink placeholder-ink-200 outline-none focus:ring-2 transition-all ${
                      touched.name && !name.trim() ? 'border-red-300 focus:ring-red-100' : 'border-ink-100 focus:border-ink focus:ring-ink/10'
                    }`}
                  />
                  {touched.name && !name.trim() && <p className="mt-1 text-xs text-red-500">Name is required</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">
                    Email address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onBlur={() => touch('email')}
                    placeholder="you@example.com"
                    className={`w-full border rounded-xl px-4 py-3 text-sm text-ink placeholder-ink-200 outline-none focus:ring-2 transition-all ${
                      touched.email && !email.includes('@') ? 'border-red-300 focus:ring-red-100' : 'border-ink-100 focus:border-ink focus:ring-ink/10'
                    }`}
                  />
                  {touched.email && !email.includes('@') && <p className="mt-1 text-xs text-red-500">Valid email is required</p>}
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-ink mb-2">
                  What's this about? <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {SUBJECTS.map(s => {
                    const Icon = s.icon
                    return (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => setSubject(s.value)}
                        className={`flex flex-col items-center text-center p-3 rounded-xl border-2 transition-all duration-200 ${
                          subject === s.value
                            ? 'border-ink bg-ink text-white'
                            : 'border-ink-100 hover:border-ink-300 text-ink-500'
                        }`}
                      >
                        <Icon className="w-4 h-4 mb-1.5" />
                        <span className="text-[11px] font-semibold leading-tight">{s.label}</span>
                      </button>
                    )
                  })}
                </div>
                {touched.subject && !subject && <p className="mt-1.5 text-xs text-red-500">Please select a topic</p>}
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">
                  Message <span className="text-red-500">*</span>
                  <span className="ml-2 text-ink-300 font-normal text-xs">({message.length}/2000)</span>
                </label>
                <textarea
                  rows={6}
                  value={message}
                  onChange={e => setMessage(e.target.value.slice(0, 2000))}
                  onBlur={() => touch('message')}
                  placeholder="Describe your issue or question in as much detail as possible. If it's a bug, include what you were doing and what happened."
                  className={`w-full border rounded-xl px-4 py-3 text-sm text-ink placeholder-ink-200 outline-none focus:ring-2 transition-all resize-none ${
                    touched.message && message.trim().length < 20 ? 'border-red-300 focus:ring-red-100' : 'border-ink-100 focus:border-ink focus:ring-ink/10'
                  }`}
                />
                {touched.message && message.trim().length < 20 && message.length > 0 && (
                  <p className="mt-1 text-xs text-red-500">Please provide a bit more detail (at least 20 characters)</p>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-ink hover:bg-ink-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm"
              >
                {submitting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Sending…
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send message
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Quick help note */}
          <p className="text-center text-xs text-ink-400 mt-6">
            Response time: 1–2 business days · We're a small team based in Edmonton
          </p>
        </div>
      </div>

      <Footer />
    </>
  )
}
