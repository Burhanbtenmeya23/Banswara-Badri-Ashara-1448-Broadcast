'use client'

import { useState, useEffect, FormEvent } from 'react'
import BroadcastPlayer from '@/components/BroadcastPlayer'

type PreviewState = 'before' | 'live' | 'ended' | null

interface Settings {
  youtube_url: string
  youtube_video_id: string
  broadcast_start_at: string | null
  broadcast_end_at: string | null
  updated_at: string
}

// Convert UTC ISO string to local datetime-local input value
function toLocalInput(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const offset = d.getTimezoneOffset()
  const local = new Date(d.getTime() - offset * 60000)
  return local.toISOString().slice(0, 16)
}

// Convert local datetime-local input value to UTC ISO string
function fromLocalInput(local: string): string | null {
  if (!local) return null
  return new Date(local).toISOString()
}

export default function BroadcastManager() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [url, setUrl] = useState('')
  const [startAt, setStartAt] = useState('')
  const [endAt, setEndAt] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [previewState, setPreviewState] = useState<PreviewState>(null)
  const [showRefreshConfirm, setShowRefreshConfirm] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [refreshDone, setRefreshDone] = useState(false)

  async function handleForceRefresh() {
    setRefreshing(true)
    try {
      await fetch('/api/admin/force-refresh', { method: 'POST' })
      setRefreshDone(true)
      setTimeout(() => setRefreshDone(false), 4000)
    } finally {
      setRefreshing(false)
      setShowRefreshConfirm(false)
    }
  }

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/admin/settings')
      if (res.ok) {
        const data = await res.json()
        if (data.settings) {
          setSettings(data.settings)
          setUrl(data.settings.youtube_url ?? '')
          setStartAt(toLocalInput(data.settings.broadcast_start_at))
          setEndAt(toLocalInput(data.settings.broadcast_end_at))
        }
      }
      setLoading(false)
    }
    load()
  }, [])

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSaving(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          youtube_url: url.trim(),
          broadcast_start_at: fromLocalInput(startAt),
          broadcast_end_at: fromLocalInput(endAt),
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setSettings(data.settings)
      setSuccess('Broadcast settings saved successfully!')
    } finally {
      setSaving(false)
    }
  }

  // Build a mock settings object for preview that matches BroadcastPlayer's interface
  const previewSettings = settings ? {
    youtube_video_id: settings.youtube_video_id,
    youtube_url: settings.youtube_url,
    broadcast_start_at: settings.broadcast_start_at,
    broadcast_end_at: settings.broadcast_end_at,
  } : null

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-8 h-8 border-2 rounded-full animate-spin"
          style={{ borderColor: 'rgba(0,48,135,0.18)', borderTopColor: '#003087' }} />
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: '#001a54' }}>Broadcast Management</h1>
          <p className="text-xs mt-1" style={{ color: 'rgba(0,26,84,0.4)' }}>
            Configure YouTube video and broadcast schedule
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <button
            onClick={() => setShowRefreshConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs rounded-lg font-medium transition-all"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#dc2626' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 4v6h-6M1 20v-6h6"/>
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
            </svg>
            Force Refresh All Users
          </button>
          {refreshDone && (
            <span className="text-xs" style={{ color: '#16a34a' }}>
              ✓ Refresh signal sent to all users
            </span>
          )}
        </div>
      </div>

      {/* Confirmation dialog */}
      {showRefreshConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
          <div className="glass-card p-6 max-w-sm w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold" style={{ color: '#001a54' }}>Force Refresh All Users?</h3>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(0,26,84,0.5)' }}>This will reload the broadcast page for every active user within 15 seconds.</p>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowRefreshConfirm(false)}
                className="flex-1 px-4 py-2 text-xs rounded-lg"
                style={{ background: 'rgba(0,48,135,0.06)', border: '1px solid rgba(0,48,135,0.15)', color: '#003087' }}>
                Cancel
              </button>
              <button onClick={handleForceRefresh} disabled={refreshing}
                className="flex-1 px-4 py-2 text-xs rounded-lg font-semibold"
                style={{ background: '#dc2626', color: '#fff', opacity: refreshing ? 0.6 : 1 }}>
                {refreshing ? 'Sending…' : 'Yes, Refresh All'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Settings Form */}
        <div className="glass-card p-6">
          <h2 className="text-sm font-medium mb-5" style={{ color: '#001a54' }}>Broadcast Settings</h2>

          {error && (
            <div className="mb-4 px-4 py-2.5 rounded-lg text-xs"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5' }}>
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 px-4 py-2.5 rounded-lg text-xs"
              style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', color: '#34d399' }}>
              {success}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="block text-xs mb-1.5" style={{ color: 'rgba(0,48,135,0.65)' }}>
                YouTube URL
              </label>
              <input type="text" className="glass-input"
                placeholder="https://www.youtube.com/watch?v=..."
                value={url} onChange={e => setUrl(e.target.value)} />
              <p className="text-xs mt-1" style={{ color: 'rgba(0,26,84,0.3)' }}>
                Supports youtube.com/watch, youtu.be, youtube.com/live
              </p>
            </div>

            <div>
              <label className="block text-xs mb-1.5" style={{ color: 'rgba(0,48,135,0.65)' }}>
                Broadcast Start Date & Time
              </label>
              <input type="datetime-local" className="glass-input"
                value={startAt} onChange={e => setStartAt(e.target.value)}
                style={{ colorScheme: 'dark' }} />
            </div>

            <div>
              <label className="block text-xs mb-1.5" style={{ color: 'rgba(0,48,135,0.65)' }}>
                Broadcast End Date & Time
              </label>
              <input type="datetime-local" className="glass-input"
                value={endAt} onChange={e => setEndAt(e.target.value)}
                style={{ colorScheme: 'dark' }} />
              <p className="text-xs mt-1" style={{ color: 'rgba(0,26,84,0.3)' }}>
                Leave blank to keep broadcast running indefinitely
              </p>
            </div>

            <button type="submit" className="btn-gold" disabled={saving}>
              {saving ? 'Saving...' : 'Save Broadcast Settings'}
            </button>
          </form>

          {settings?.youtube_video_id && (
            <div className="mt-5 pt-4 text-xs space-y-1" style={{ borderTop: '1px solid rgba(0,48,135,0.08)' }}>
              <p style={{ color: 'rgba(0,26,84,0.4)' }}>
                Video ID: <span className="font-mono" style={{ color: '#003087' }}>{settings.youtube_video_id}</span>
              </p>
              <p style={{ color: 'rgba(0,26,84,0.3)' }}>
                Last updated: {new Date(settings.updated_at).toLocaleString('en-IN')}
              </p>
            </div>
          )}
        </div>

        {/* Preview Panel */}
        <div className="glass-card p-6">
          <h2 className="text-sm font-medium mb-4" style={{ color: '#001a54' }}>Preview States</h2>

          <div className="flex flex-wrap gap-2 mb-5">
            {([
              { value: null, label: 'Auto (Real Time)' },
              { value: 'before', label: 'Before Start' },
              { value: 'live', label: 'Live' },
              { value: 'ended', label: 'Ended' },
            ] as { value: PreviewState; label: string }[]).map(opt => (
              <button key={String(opt.value)}
                onClick={() => setPreviewState(opt.value)}
                className="text-xs px-3 py-1.5 rounded-lg transition-all"
                style={{
                  background: previewState === opt.value ? 'rgba(0,48,135,0.12)' : 'rgba(0,48,135,0.05)',
                  border: previewState === opt.value ? '1px solid rgba(0,48,135,0.22)' : '1px solid rgba(0,48,135,0.1)',
                  color: previewState === opt.value ? '#003087' : 'rgba(0,26,84,0.5)',
                }}>
                {opt.label}
              </button>
            ))}
          </div>

          <div className="rounded-xl overflow-hidden flex flex-col min-h-64"
            style={{ background: 'rgba(255,255,255,0.96)', border: '1px solid rgba(0,48,135,0.08)' }}>
            <BroadcastPlayer settings={previewSettings} previewState={previewState} />
          </div>

          <p className="text-xs mt-3" style={{ color: 'rgba(0,26,84,0.25)' }}>
            Preview only — does not affect what users see
          </p>
        </div>
      </div>
    </div>
  )
}
