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
      <div className="mb-6">
        <h1 className="text-xl font-semibold" style={{ color: '#001a54' }}>Broadcast Management</h1>
        <p className="text-xs mt-1" style={{ color: 'rgba(0,26,84,0.4)' }}>
          Configure YouTube video and broadcast schedule
        </p>
      </div>

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
