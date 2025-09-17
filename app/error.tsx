'use client'

import { useEffect } from 'react'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
  useEffect(() => {
    // Log to console; in prod, connect to Sentry
    // eslint-disable-next-line no-console
    console.error('GlobalError:', error)
  }, [error])

  return (
    <html>
      <body>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
          <div style={{ background: 'white', padding: 24, borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', maxWidth: 560 }}>
            <h1 style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 8 }}>Something went wrong</h1>
            <p style={{ fontSize: 14, color: '#374151', marginBottom: 12 }}>An error occurred while rendering this page.</p>
            {error?.digest && (
              <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 12 }}>Error digest: {error.digest}</p>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => reset()} style={{ padding: '8px 12px', borderRadius: 8, background: '#2563eb', color: 'white' }}>Try again</button>
              <a href="/" style={{ padding: '8px 12px', borderRadius: 8, background: '#e5e7eb', color: '#111827', textDecoration: 'none' }}>Go home</a>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
