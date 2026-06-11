'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface BroadcastSettings {
  youtube_video_id: string | null
  youtube_url: string | null
}

const SESSION_CHECK_INTERVAL = 30 * 1000 // 30 seconds

export default function BroadcastClient() {
  const router = useRouter()
  const [settings, setSettings] = useState<BroadcastSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [terminated, setTerminated] = useState(false)
  const [itsId, setItsId] = useState('')

  const verifyAndLoad = useCallback(async () => {
    try {
      const res = await fetch('/api/broadcast')
      if (!res.ok) {
        const data = await res.json()
        if (data.error === 'session_terminated') {
          setTerminated(true)
          return
        }
        router.replace('/')
        return
      }
      const data = await res.json()
      setSettings(data.settings)
    } catch {
      setError('Connection error. Please refresh.')
    } finally {
      setLoading(false)
    }
  }, [router])

  const checkSession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/verify')
      if (!res.ok) {
        const data = await res.json()
        if (data.reason === 'session_terminated') {
          setTerminated(true)
        } else {
          router.replace('/')
        }
      } else {
        const data = await res.json()
        setItsId(data.itsId ?? '')
      }
    } catch {
      // Network blip — don't logout on transient errors
    }
  }, [router])

  useEffect(() => {
    verifyAndLoad()
    checkSession()
  }, [verifyAndLoad, checkSession])

  // Periodic session check
  useEffect(() => {
    const interval = setInterval(checkSession, SESSION_CHECK_INTERVAL)
    return () => clearInterval(interval)
  }, [checkSession])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.replace('/')
  }

  if (terminated) {
    return (
      <div className="bg-broadcast min-h-screen flex items-center justify-center px-4">
        <div className="glass-card p-8 max-w-md w-full text-center">
          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fca5a5" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          </div>
          <h2 className="text-lg font-semibold mb-3" style={{ color: '#fca5a5' }}>Session Terminated</h2>
          <p className="text-sm mb-6" style={{ color: 'rgba(245,239,224,0.65)' }}>
            Your session has been terminated because your account was used on another device.
          </p>
          <button onClick={() => router.replace('/')} className="btn-gold">
            Back to Login
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-broadcast min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: 'rgba(201,168,76,0.5)', borderTopColor: 'transparent' }} />
          <p className="text-sm" style={{ color: 'rgba(201,168,76,0.6)' }}>Loading broadcast...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-broadcast min-h-screen flex items-center justify-center px-4">
        <div className="glass-card p-8 text-center max-w-sm w-full">
          <p className="text-sm mb-4" style={{ color: '#fca5a5' }}>{error}</p>
          <button onClick={verifyAndLoad} className="btn-gold">Retry</button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-broadcast min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderBottom: '1px solid rgba(201,168,76,0.12)', background: 'rgba(13,10,3,0.6)', backdropFilter: 'blur(10px)' }}>
        <div>
          <h1 className="text-sm font-semibold" style={{ color: '#f5efe0' }}>
            Banswara Badri Ashara <span className="gold-text">1448</span>
          </h1>
          <p className="text-xs" style={{ color: 'rgba(201,168,76,0.5)' }}>Live Broadcast</p>
        </div>
        <div className="flex items-center gap-3">
          {itsId && (
            <span className="text-xs px-2 py-1 rounded"
              style={{ background: 'rgba(201,168,76,0.1)', color: 'rgba(201,168,76,0.7)', border: '1px solid rgba(201,168,76,0.2)' }}>
              {itsId}
            </span>
          )}
          <button onClick={handleLogout}
            className="text-xs px-3 py-1.5 rounded transition-all"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(245,239,224,0.6)' }}
            onMouseEnter={e => { (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.08)' }}
            onMouseLeave={e => { (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.05)' }}>
            Logout
          </button>
        </div>
      </header>

      {/* Video Player */}
      <main className="flex-1 flex flex-col items-center justify-center px-2 py-4">
        {settings?.youtube_video_id ? (
          <div className="w-full max-w-4xl">
            <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
              <iframe
                className="absolute inset-0 w-full h-full rounded-xl"
                src={`https://www.youtube.com/embed/${settings.youtube_video_id}?autoplay=1&rel=0&modestbranding=1`}
                title="Banswara Badri Ashara 1448 Broadcast"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                style={{ border: '1px solid rgba(201,168,76,0.15)' }}
              />
            </div>
            <p className="text-center text-xs mt-3" style={{ color: 'rgba(245,239,224,0.25)' }}>
              Session verified every 30 seconds — single device only
            </p>
          </div>
        ) : (
          <div className="glass-card p-10 text-center max-w-md">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.5">
                <polygon points="23 7 16 12 23 17 23 7"/>
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
              </svg>
            </div>
            <h2 className="font-medium mb-2" style={{ color: '#f5efe0' }}>Broadcast Not Available</h2>
            <p className="text-sm" style={{ color: 'rgba(245,239,224,0.45)' }}>
              The broadcast has not started yet. Please check back shortly.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
