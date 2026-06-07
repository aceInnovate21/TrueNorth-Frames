'use client'

import { useEffect } from 'react'
import { RefreshCw } from 'lucide-react'

// Catches errors thrown inside the root layout (fonts, metadata providers, etc.)
// Must render its own <html> and <body> — cannot use Nav/Footer
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[TrueNorth] Root layout error:', error)
  }, [error])

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#fff', color: '#0a0a0a' }}>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ maxWidth: 400, width: '100%', textAlign: 'center' }}>
            <div style={{
              width: 56, height: 56, background: '#fef2f2', borderRadius: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px', border: '1px solid #fecaca',
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#f87171', marginBottom: 12 }}>
              Something went wrong
            </p>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12, lineHeight: 1.2 }}>TrueNorth Frames is having trouble</h1>
            <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6, marginBottom: 24 }}>
              An unexpected error occurred. Please try refreshing the page.
            </p>
            {error.digest && (
              <p style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'monospace', marginBottom: 24 }}>
                Error ID: {error.digest}
              </p>
            )}
            <button
              onClick={reset}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: '#0a0a0a', color: '#fff', fontWeight: 600, fontSize: 14,
                padding: '12px 24px', borderRadius: 12, border: 'none', cursor: 'pointer',
              }}
            >
              <RefreshCw size={16} /> Try again
            </button>
            <div style={{ marginTop: 24 }}>
              <a href="/" style={{ fontSize: 13, color: '#6b7280', textDecoration: 'underline' }}>Back to home</a>
              {' · '}
              <a href="/contact" style={{ fontSize: 13, color: '#6b7280', textDecoration: 'underline' }}>Contact support</a>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
