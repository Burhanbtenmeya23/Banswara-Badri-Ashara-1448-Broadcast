'use client'

import { useState, useEffect, FormEvent } from 'react'

interface Settings {
  youtube_url: string
  youtube_video_id: string
  updated_at: string
}

export default function BroadcastManager() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [preview, setPreview] = useState(false)

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/admin/settings')
      if (res.ok) {
        const data = await res.json()
        if (data.settings) {
          setSettings(data.settings)
          setUrl(data.settings.youtube_url)
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
        body: JSON.stringify({ youtube_url: url.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setSettings(data.settings)
      setSuccess('Broadcast URL updated successfully!')
      setPreview(true)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-8 h-8 border-2 rounded-full animate-spin"
          style={{ borderColor: 'rgba(201,168,76,0.3)', borderTopColor: '#c9a84c' }} />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold" style={{ color: '#f5efe0' }}>Broadcast Management</h1>
        <p className="text-xs mt-1" style={{ color: 'rgba(245,239,224,0.4)' }}>
          Set the YouTube video for the broadcast portal
        </p>
      </div>

      <div className="glass-card p-6 mb-6 max-w-xl">
        <h2 className="text-sm font-medium mb-4" style={{ color: '#f5efe0' }}>YouTube Video URL</h2>

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

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs mb-1.5" style={{ color: 'rgba(201,168,76,0.8)' }}>
              YouTube URL
            </label>
            <input
              type="url"
              className="glass-input"
              placeholder="https://www.youtube.com/watch?v=..."
              value={url}
              onChange={e => setUrl(e.target.value)}
              required
            />
            <p className="text-xs mt-1.5" style={{ color: 'rgba(245,239,224,0.3)' }}>
              Supports: youtube.com/watch?v=... or youtu.be/...
            </p>
          </div>

          <div className="flex gap-3">
            <button type="submit" className="btn-gold" style={{ width: 'auto' }} disabled={saving}>
              {saving ? 'Saving...' : 'Update Broadcast'}
            </button>
            {settings?.youtube_video_id && (
              <button type="button" onClick={() => setPreview(p => !p)}
                className="px-4 py-2.5 text-sm rounded-lg transition-all"
                style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)', color: '#c9a84c' }}>
                {preview ? 'Hide' : 'Preview'}
              </button>
            )}
          </div>
        </form>

        {settings && (
          <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(201,168,76,0.1)' }}>
            <p className="text-xs" style={{ color: 'rgba(245,239,224,0.4)' }}>
              Current Video ID: <span className="font-mono" style={{ color: '#c9a84c' }}>{settings.youtube_video_id}</span>
            </p>
            <p className="text-xs mt-1" style={{ color: 'rgba(245,239,224,0.3)' }}>
              Last updated: {new Date(settings.updated_at).toLocaleString('en-IN')}
            </p>
          </div>
        )}
      </div>

      {/* Preview */}
      {preview && settings?.youtube_video_id && (
        <div className="max-w-2xl">
          <h2 className="text-sm font-medium mb-3" style={{ color: '#f5efe0' }}>Preview</h2>
          <div className="glass-card p-3">
            <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
              <iframe
                className="absolute inset-0 w-full h-full rounded-lg"
                src={`https://www.youtube.com/embed/${settings.youtube_video_id}?rel=0&modestbranding=1`}
                title="Broadcast Preview"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
