'use client'

import { useState, useEffect } from 'react'
import YouTubePlayer from '@/components/YouTubePlayer'

interface BroadcastSettings {
  youtube_video_id: string | null
  youtube_url: string | null
  broadcast_start_at: string | null
  broadcast_end_at: string | null
}

type BroadcastState = 'loading' | 'before' | 'live' | 'ended' | 'no_video'

interface Countdown {
  days: number
  hours: number
  minutes: number
  seconds: number
}

function getCountdown(target: Date): Countdown {
  const diff = Math.max(0, target.getTime() - Date.now())
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  }
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function getBroadcastState(settings: BroadcastSettings | null): BroadcastState {
  if (!settings?.youtube_video_id) return 'no_video'
  const now = Date.now()
  const start = settings.broadcast_start_at ? new Date(settings.broadcast_start_at).getTime() : null
  const end = settings.broadcast_end_at ? new Date(settings.broadcast_end_at).getTime() : null
  if (start && now < start) return 'before'
  if (end && now > end) return 'ended'
  return 'live'
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  })
}

export default function BroadcastPlayer({
  settings,
  previewState,
  itsId,
}: {
  settings: BroadcastSettings | null
  previewState?: BroadcastState | null
  itsId?: string
}) {
  const [state, setState] = useState<BroadcastState>('loading')
  const [countdown, setCountdown] = useState<Countdown>({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    function update() {
      const s = previewState ?? getBroadcastState(settings)
      setState(s)
      if (s === 'before' && settings?.broadcast_start_at) {
        setCountdown(getCountdown(new Date(settings.broadcast_start_at)))
      }
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [settings, previewState])

  // ── No video configured ─────────────────────────────────────────────────
  if (state === 'no_video' || state === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center flex-1 px-4">
        <div className="glass-card p-10 text-center max-w-md w-full">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(0,48,135,0.08)', border: '1px solid rgba(0,48,135,0.12)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#003087" strokeWidth="1.5">
              <polygon points="23 7 16 12 23 17 23 7"/>
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
            </svg>
          </div>
          <h2 className="font-medium mb-2" style={{ color: '#001a54' }}>Broadcast Not Available</h2>
          <p className="text-sm" style={{ color: 'rgba(0,26,84,0.45)' }}>
            The broadcast has not been configured yet.
          </p>
        </div>
      </div>
    )
  }

  // ── Before start ────────────────────────────────────────────────────────
  if (state === 'before') {
    return (
      <div className="flex flex-col items-center justify-center flex-1 px-4 py-8">
        <div className="glass-card p-8 text-center max-w-lg w-full">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ background: 'rgba(0,48,135,0.08)', border: '1px solid rgba(0,48,135,0.15)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#003087" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>

          <h2 className="text-lg font-semibold mb-2" style={{ color: '#001a54' }}>
            Broadcast Not Yet Started
          </h2>

          {settings?.broadcast_start_at && (
            <p className="text-sm mb-7" style={{ color: 'rgba(0,26,84,0.5)' }}>
              Broadcast will begin at{' '}
              <span style={{ color: '#003087' }}>{formatDateTime(settings.broadcast_start_at)}</span>
            </p>
          )}

          {/* Countdown */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Days', value: countdown.days },
              { label: 'Hours', value: countdown.hours },
              { label: 'Mins', value: countdown.minutes },
              { label: 'Secs', value: countdown.seconds },
            ].map(({ label, value }) => (
              <div key={label} className="flex flex-col items-center py-4 px-2 rounded-xl"
                style={{ background: 'rgba(201,147,10,0.07)', border: '1px solid rgba(0,48,135,0.1)' }}>
                <span className="text-2xl font-bold tabular-nums" style={{ color: '#003087' }}>
                  {pad(value)}
                </span>
                <span className="text-xs mt-1" style={{ color: 'rgba(0,26,84,0.35)' }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── Broadcast ended ──────────────────────────────────────────────────────
  if (state === 'ended') {
    return (
      <div className="flex flex-col items-center justify-center flex-1 px-4">
        <div className="glass-card p-10 text-center max-w-md w-full">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(0,48,135,0.06)', border: '1px solid rgba(0,48,135,0.12)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#003087" strokeWidth="1.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h2 className="text-lg font-semibold mb-2" style={{ color: '#001a54' }}>Broadcast Has Ended</h2>
          <p className="text-sm mb-1" style={{ color: 'rgba(0,26,84,0.5)' }}>
            This broadcast has concluded.
          </p>
          <p className="text-sm mb-1" style={{ color: 'rgba(0,26,84,0.5)' }}>
            Thank you for attending.
          </p>
          <p className="text-xs mt-4" style={{ color: 'rgba(0,26,84,0.3)' }}>
            Please check back for future broadcasts.
          </p>
        </div>
      </div>
    )
  }

  // ── Live ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center justify-center flex-1 w-full px-0 sm:px-4 py-2 sm:py-4">
      <div className="w-full max-w-5xl">
        {/* Live badge */}
        <div className="flex items-center justify-center mb-3">
          <span className="flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full"
            style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5' }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#ef4444' }} />
            LIVE
          </span>
        </div>

        <YouTubePlayer url={settings!.youtube_url ?? ''} itsId={itsId} />
      </div>
    </div>
  )
}
