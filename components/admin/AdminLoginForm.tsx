'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginForm() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Invalid credentials.')
        return
      }

      router.push('/admin/dashboard')
    } catch {
      setError('Network error.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-broadcast min-h-screen flex items-center justify-center px-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full opacity-8"
          style={{ background: 'radial-gradient(circle, #c9a84c 0%, transparent 70%)' }} />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://asharamubaraka.net/images/am48-logo-v3.svg"
              alt="Ashara Mubaraka 1448"
              width={80}
              height={80}
              style={{ filter: 'drop-shadow(0 0 8px rgba(201,168,76,0.25))', opacity: 0.85 }}
            />
          </div>
          <h1 className="text-lg font-semibold" style={{ color: '#f5efe0' }}>Admin Access</h1>
          <p className="text-xs mt-1" style={{ color: 'rgba(201,168,76,0.5)' }}>Restricted — Authorized Personnel Only</p>
        </div>

        <div className="glass-card p-7">
          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg text-sm text-center"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(201,168,76,0.8)' }}>
                Username
              </label>
              <input
                type="text"
                className="glass-input"
                placeholder="Admin username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(201,168,76,0.8)' }}>
                Password
              </label>
              <input
                type="password"
                className="glass-input"
                placeholder="Admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <button type="submit" className="btn-gold mt-2" disabled={loading}>
              {loading ? 'Authenticating...' : 'Access Dashboard'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-4">
          <a href="/" style={{ color: 'rgba(245,239,224,0.3)' }} className="hover:underline">
            ← User Login
          </a>
        </p>
      </div>
    </div>
  )
}
