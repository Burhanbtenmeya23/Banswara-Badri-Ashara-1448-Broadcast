'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import BroadcastPlayer from '@/components/BroadcastPlayer'

interface BroadcastSettings {
  youtube_video_id: string | null
  youtube_url: string | null
  broadcast_start_at: string | null
  broadcast_end_at: string | null
}

const SESSION_CHECK_INTERVAL = 30 * 1000

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
      if (res.status === 401) {
        window.location.href = '/'
        return
      }
      if (!res.ok) {
        setError('Could not load broadcast. Please refresh.')
        setLoading(false)
        return
      }
      const data = await res.json()
      setSettings(data.settings)
    } catch {
      setError('Connection error. Please refresh.')
    } finally {
      setLoading(false)
    }
  }, [])

  const checkSession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/verify')
      if (res.ok) {
        const data = await res.json()
        setItsId(data.itsId ?? '')
      } else {
        const data = await res.json().catch(() => ({}))
        if (data.reason === 'session_terminated') {
          setTerminated(true)
        }
      }
    } catch {
      // Network blip — ignore
    }
  }, [])

  useEffect(() => {
    verifyAndLoad()
    checkSession()
  }, [verifyAndLoad, checkSession])

  useEffect(() => {
    const interval = setInterval(checkSession, SESSION_CHECK_INTERVAL)
    return () => clearInterval(interval)
  }, [checkSession])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/'
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
          <button onClick={() => { window.location.href = '/' }} className="btn-gold">
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
          <div className="w-10 h-10 border-2 rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: 'rgba(201,168,76,0.3)', borderTopColor: '#c9a84c' }} />
          <p className="text-sm" style={{ color: 'rgba(201,168,76,0.6)' }}>Loading Broadcast...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-broadcast min-h-screen flex items-center justify-center px-4">
        <div className="glass-card p-8 text-center max-w-sm w-full">
          <p className="text-sm mb-2" style={{ color: '#fca5a5' }}>Broadcast unavailable.</p>
          <p className="text-xs mb-5" style={{ color: 'rgba(245,239,224,0.4)' }}>Please contact the administrator.</p>
          <button onClick={verifyAndLoad} className="btn-gold">Retry</button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="bg-broadcast min-h-screen flex flex-col select-none"
      style={{ touchAction: 'pan-y', WebkitUserSelect: 'none', MozUserSelect: 'none' } as React.CSSProperties}
      onContextMenu={e => e.preventDefault()}
      onDragStart={e => e.preventDefault()}
    >
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderBottom: '1px solid rgba(201,168,76,0.12)', background: 'rgba(13,10,3,0.7)', backdropFilter: 'blur(10px)' }}>
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
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(245,239,224,0.6)' }}>
            Logout
          </button>
        </div>
      </header>

      {/* Player */}
      <BroadcastPlayer settings={settings} itsId={itsId} />
    </div>
  )
}
