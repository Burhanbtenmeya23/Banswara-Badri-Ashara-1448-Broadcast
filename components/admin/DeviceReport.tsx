'use client'

import { useState, useEffect, useCallback } from 'react'

interface UserRow {
  its_id: string
  total_logins: number
  last_seen: string
  devices: Record<string, number>
  browsers: Record<string, number>
  unique_ips: number
}

interface Summary {
  devices: Record<string, number>
  browsers: Record<string, number>
}

// Device type → icon + colour
function DeviceChip({ label, count }: { label: string; count: number }) {
  const isTv = label.toLowerCase().includes('tv') || label.toLowerCase().includes('roku') || label.toLowerCase().includes('fire') || label.toLowerCase().includes('chromecast')
  const isPhone = label.includes('iPhone') || label.includes('Android Phone')
  const isTablet = label.includes('iPad') || label.includes('Tablet')

  let bg = 'rgba(0,48,135,0.07)'
  let color = '#003087'
  if (isTv) { bg = 'rgba(124,58,237,0.08)'; color = '#6d28d9' }
  else if (isPhone) { bg = 'rgba(16,185,129,0.08)'; color = '#047857' }
  else if (isTablet) { bg = 'rgba(245,158,11,0.08)'; color = '#b45309' }

  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
      style={{ background: bg, color, border: `1px solid ${color}20` }}>
      {label} {count > 1 && <span className="font-semibold">×{count}</span>}
    </span>
  )
}

function SummaryCard({ title, data }: { title: string; data: Record<string, number> }) {
  const total = Object.values(data).reduce((a, b) => a + b, 0)
  const sorted = Object.entries(data).sort((a, b) => b[1] - a[1])

  return (
    <div className="glass-card p-5">
      <h3 className="text-sm font-semibold mb-4" style={{ color: '#001a54' }}>{title}</h3>
      <div className="space-y-2">
        {sorted.map(([label, count]) => (
          <div key={label} className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex justify-between mb-0.5">
                <span className="text-xs truncate" style={{ color: '#001a54' }}>{label}</span>
                <span className="text-xs font-medium ml-2 shrink-0" style={{ color: '#003087' }}>{count}</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,48,135,0.08)' }}>
                <div className="h-full rounded-full" style={{ width: `${(count / total) * 100}%`, background: '#003087' }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function DeviceReport() {
  const [report, setReport] = useState<UserRow[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/device-report')
      if (res.ok) {
        const data = await res.json()
        setReport(data.report ?? [])
        setSummary(data.summary ?? null)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  function exportCsv() {
    const rows = [['ITS ID', 'Total Logins', 'Last Seen', 'Devices', 'Browsers', 'Unique IPs']]
    for (const r of report) {
      rows.push([
        r.its_id,
        String(r.total_logins),
        r.last_seen,
        Object.entries(r.devices).map(([d, c]) => `${d}(${c})`).join(' | '),
        Object.entries(r.browsers).map(([b, c]) => `${b}(${c})`).join(' | '),
        String(r.unique_ips),
      ])
    }
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'device_report.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const filtered = report.filter(r => r.its_id.includes(search))

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: '#001a54' }}>Device Report</h1>
          <p className="text-xs mt-1" style={{ color: 'rgba(0,26,84,0.4)' }}>
            Login history and device types per ITS ID
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={load}
            className="px-3 py-2 text-xs rounded-lg"
            style={{ background: 'rgba(0,48,135,0.08)', border: '1px solid rgba(0,48,135,0.15)', color: '#003087' }}>
            Refresh
          </button>
          <button onClick={exportCsv}
            className="px-3 py-2 text-xs rounded-lg"
            style={{ background: 'rgba(0,48,135,0.08)', border: '1px solid rgba(0,48,135,0.15)', color: '#003087' }}>
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <SummaryCard title="Logins by Device Type" data={summary.devices} />
          <SummaryCard title="Logins by Browser" data={summary.browsers} />
        </div>
      )}

      {/* Search */}
      <div className="mb-4">
        <input type="text" className="glass-input max-w-xs" placeholder="Search by ITS ID..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full admin-table">
            <thead>
              <tr>
                <th className="text-left">ITS ID</th>
                <th className="text-left">Logins</th>
                <th className="text-left">Devices Used</th>
                <th className="text-left">Browser</th>
                <th className="text-left">Unique IPs</th>
                <th className="text-left">Last Seen</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8" style={{ color: 'rgba(0,26,84,0.35)' }}>Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8" style={{ color: 'rgba(0,26,84,0.35)' }}>
                  {report.length === 0 ? 'No login data yet. Data will appear after users log in.' : 'No results found.'}
                </td></tr>
              ) : filtered.map((row) => (
                <tr key={row.its_id}>
                  <td className="font-mono font-medium">{row.its_id}</td>
                  <td>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded"
                      style={{ background: 'rgba(0,48,135,0.08)', color: '#003087' }}>
                      {row.total_logins}
                    </span>
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(row.devices).map(([d, c]) => (
                        <DeviceChip key={d} label={d} count={c} />
                      ))}
                    </div>
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(row.browsers).map(([b, c]) => (
                        <span key={b} className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(0,26,84,0.06)', color: 'rgba(0,26,84,0.6)', border: '1px solid rgba(0,26,84,0.1)' }}>
                          {b}{c > 1 ? ` ×${c}` : ''}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="text-xs" style={{ color: 'rgba(0,26,84,0.5)' }}>{row.unique_ips}</td>
                  <td className="text-xs" style={{ color: 'rgba(0,26,84,0.5)' }}>{formatDate(row.last_seen)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs mt-4" style={{ color: 'rgba(0,26,84,0.3)' }}>
        Note: Device data is only collected from new logins after this feature was deployed.
        Existing sessions show no device info.
      </p>
    </div>
  )
}
