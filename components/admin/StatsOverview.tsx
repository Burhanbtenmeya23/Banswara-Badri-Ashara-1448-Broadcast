'use client'

import { useEffect, useState } from 'react'

interface Stats {
  totalUsers: number
  onlineUsers: number
  activeSessions: number
  recentLogins: { its_id: string; last_login: string }[]
}

function StatCard({ label, value, icon, color }: {
  label: string; value: number | string; icon: React.ReactNode; color: string
}) {
  return (
    <div className="glass-card p-5 flex items-center gap-4">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div>
        <p className="text-xl font-bold" style={{ color: '#f5efe0' }}>{value}</p>
        <p className="text-xs mt-0.5" style={{ color: 'rgba(245,239,224,0.45)' }}>{label}</p>
      </div>
    </div>
  )
}

export default function StatsOverview() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/admin/stats')
      if (res.ok) setStats(await res.json())
      setLoading(false)
    }
    load()
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [])

  function formatTime(iso: string) {
    const d = new Date(iso)
    return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
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
        <h1 className="text-xl font-semibold" style={{ color: '#f5efe0' }}>Dashboard Overview</h1>
        <p className="text-xs mt-1" style={{ color: 'rgba(245,239,224,0.4)' }}>
          Live stats — refreshes every 30 seconds
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Total Users" value={stats?.totalUsers ?? 0} color="#c9a84c"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
          </svg>}
        />
        <StatCard label="Online Users (5 min)" value={stats?.onlineUsers ?? 0} color="#34d399"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
          </svg>}
        />
        <StatCard label="Active Sessions" value={stats?.activeSessions ?? 0} color="#60a5fa"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
          </svg>}
        />
      </div>

      {/* Recent logins */}
      <div className="glass-card overflow-hidden">
        <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(201,168,76,0.1)' }}>
          <h2 className="text-sm font-medium" style={{ color: '#f5efe0' }}>Recent Logins</h2>
        </div>
        {!stats?.recentLogins?.length ? (
          <p className="px-5 py-6 text-sm text-center" style={{ color: 'rgba(245,239,224,0.35)' }}>No logins recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full admin-table">
              <thead>
                <tr>
                  <th className="text-left">ITS ID</th>
                  <th className="text-left">Last Login</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentLogins.map((u, i) => (
                  <tr key={i}>
                    <td className="font-mono">{u.its_id}</td>
                    <td>{formatTime(u.last_login)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
