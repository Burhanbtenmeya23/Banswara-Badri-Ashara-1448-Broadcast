'use client'

import { useState, FormEvent } from 'react'

export default function LoginForm() {
  const [itsId, setItsId] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ its_id: itsId.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Login failed. Please try again.')
        return
      }

      window.location.href = '/broadcast'
    } catch {
      setError('Network error. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-broadcast min-h-screen flex flex-col items-center justify-center px-4 py-8">
      {/* Decorative background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #003087 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full opacity-8"
          style={{ background: 'radial-gradient(circle, #003087 0%, transparent 70%)' }} />
      </div>

      <div className="relative w-full max-w-sm">
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
              <input
                type="text"
                inputMode="numeric"
                pattern="\d{8}"
                maxLength={8}
                className="glass-input"
                placeholder="Enter your 8-digit ITS ID"
                value={itsId}
                onChange={(e) => setItsId(e.target.value.replace(/\D/g, '').slice(0, 8))}
                required
                autoFocus
                autoComplete="username"
              />
            </div>

            <button type="submit" className="btn-gold mt-2" disabled={loading}>
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

        <p className="text-center text-xs mt-6" style={{ color: 'rgba(0,26,84,0.35)' }}>
          Access restricted. Contact admin for credentials.
        </p>
      </div>
    </div>
  )
}
