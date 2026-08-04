import { describe, it, expect } from 'vitest'
import { clampMessageBody, sendBlockedReason, checkMessageRateLimit } from '@/lib/messaging'
import { PLATFORM_CONFIG } from '@/lib/platform-config'

describe('clampMessageBody', () => {
  it('returns empty string for non-string input', () => {
    expect(clampMessageBody(undefined)).toBe('')
    expect(clampMessageBody(null)).toBe('')
    expect(clampMessageBody(42)).toBe('')
  })

  it('trims surrounding whitespace', () => {
    expect(clampMessageBody('  hi  ')).toBe('hi')
  })

  it('caps the body at max_message_length', () => {
    const long = 'x'.repeat(PLATFORM_CONFIG.max_message_length + 500)
    expect(clampMessageBody(long).length).toBe(PLATFORM_CONFIG.max_message_length)
  })
})

describe('sendBlockedReason', () => {
  it('allows a clean conversation', () => {
    expect(sendBlockedReason({ blocked: false, frozen: false })).toBeNull()
  })

  it('reports a frozen conversation first', () => {
    expect(sendBlockedReason({ blocked: true, frozen: true })).toMatch(/administrator/)
  })

  it('reports a blocked photographer', () => {
    expect(sendBlockedReason({ blocked: true, frozen: false })).toMatch(/blocked/)
  })
})

describe('checkMessageRateLimit', () => {
  // Minimal fake of the Supabase query chain used by the helper.
  const fakeDb = (count: number) => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          gte: () => Promise.resolve({ count }),
        }),
      }),
    }),
  })

  it('is not exceeded below the cap and reports remaining sends', async () => {
    const r = await checkMessageRateLimit(fakeDb(5), 'user-1')
    expect(r.exceeded).toBe(false)
    expect(r.remaining).toBe(PLATFORM_CONFIG.max_messages_per_hour - 5)
  })

  it('is exceeded at the cap with zero remaining', async () => {
    const r = await checkMessageRateLimit(fakeDb(PLATFORM_CONFIG.max_messages_per_hour), 'user-1')
    expect(r.exceeded).toBe(true)
    expect(r.remaining).toBe(0)
  })

  it('treats a null count as zero sent', async () => {
    const r = await checkMessageRateLimit(fakeDb(null as unknown as number), 'user-1')
    expect(r.exceeded).toBe(false)
    expect(r.remaining).toBe(PLATFORM_CONFIG.max_messages_per_hour)
  })
})
