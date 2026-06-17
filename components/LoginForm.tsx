'use client'

import { useState, useRef, FormEvent } from 'react'

export default function LoginForm() {
  // Uncontrolled input — TV browsers don't fire onChange reliably during typing.
  // We read the DOM value directly on submit instead.
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    // Read value directly from DOM — works on all TV browsers regardless of
    // whether onChange / input events fired during typing
    const raw = inputRef.current?.value ?? ''
    const itsId = raw.replace(/\D/g, '').slice(0, 8)

    if (itsId.length !== 8) {
      setError('ITS ID must be exactly 8 digits.')
      return
    }

    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ its_id: itsId }),
      })

      let data: { error?: string } = {}
      try { data = await res.json() } catch {}

      if (!res.ok) {
        setError(data.error ?? 'Login failed. Please try again.')
        return
      }

      // Show success banner before navigating — TV browsers can be slow
      setSuccess(true)
      setTimeout(() => {
        try { window.location.replace('/broadcast') } catch {
          try { window.location.href = '/broadcast' } catch {}
        }
      }, 300)
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-broadcast" style={{
      display: 'table', width: '100%', height: '100%',
      minHeight: '100vh', minWidth: '100%',
      position: 'fixed', top: 0, left: 0, overflowY: 'auto',
      paddingTop: 32, paddingBottom: 32,
      boxSizing: 'border-box',
    }}>
    <div style={{ display: 'table-cell', verticalAlign: 'middle', padding: '0 16px' }}>
      {/* Decorative background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #003087 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full opacity-8"
          style={{ background: 'radial-gradient(circle, #003087 0%, transparent 70%)' }} />
      </div>

      <div className="relative w-full" style={{ maxWidth: 400 }}>
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://asharamubaraka.net/images/am48-logo-v3.svg"
              alt="Ashara Mubaraka 1448"
              width={120}
              height={120}
              style={{ filter: 'drop-shadow(0 0 12px rgba(0,48,135,0.2))' }}
            />
          </div>
          <h1 className="text-2xl font-bold text-[#001a54] leading-tight mb-1">
            Ashara Mubaraka 1448
          </h1>
          <p className="text-[rgba(0,26,84,0.6)] text-sm mt-1 font-medium">
            Badri mohallah – Banswara
          </p>
          <p className="text-[rgba(0,26,84,0.35)] text-xs mt-2 tracking-widest uppercase">
            Private Broadcast Portal
          </p>
        </div>

        {/* Card */}
        <div className="glass-card p-7">
          <h2 className="text-center text-[rgba(0,26,84,0.6)] text-sm mb-6 font-normal">
            Enter your ITS ID to access the broadcast
          </h2>

          {success && (
            <div className="mb-4 px-4 py-3 rounded-lg text-sm text-center"
              style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.25)', color: '#059669' }}>
              Login successful. Loading broadcast…
            </div>
          )}

          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg text-sm text-center"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#dc2626' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#003087' }}>
                ITS ID
              </label>
              {/* Uncontrolled input — no onChange, no value prop.
                  TV browsers (Samsung, LG, Android TV) update the DOM value
                  directly via their virtual keyboard without firing input events. */}
              <input
                ref={inputRef}
                type="number"
                className="glass-input"
                placeholder="Enter your 8-digit ITS ID"
                autoComplete="username"
              />
            </div>

            <button type="submit" className="btn-gold mt-2" disabled={loading || success}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                  </svg>
                  Verifying...
                </span>
              ) : (
                'Enter Broadcast'
              )}
            </button>
          </form>
        </div>

        {error && (
          <p className="text-center text-xs mt-6" style={{ color: 'rgba(0,26,84,0.35)' }}>
            Access restricted. Contact admin for credentials.
          </p>
        )}
      </div>
    </div>
    </div>
  )
}
