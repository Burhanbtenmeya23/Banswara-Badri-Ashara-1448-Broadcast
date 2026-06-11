'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

const navItems = [
  { href: '/admin/dashboard', label: 'Overview', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  )},
  { href: '/admin/dashboard/users', label: 'Users', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
    </svg>
  )},
  { href: '/admin/dashboard/broadcast', label: 'Broadcast', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polygon points="23 7 16 12 23 17 23 7"/>
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
    </svg>
  )},
]

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    async function verify() {
      try {
        const res = await fetch('/api/admin/stats')
        if (res.status === 401) {
          window.location.href = '/admin/login'
          return
        }
      } catch {
        window.location.href = '/admin/login'
        return
      }
      setChecking(false)
    }
    verify()
  }, [])

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    window.location.href = '/admin/login'
  }

  if (checking) {
    return (
      <div className="bg-broadcast min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 rounded-full animate-spin"
          style={{ borderColor: 'rgba(0,48,135,0.18)', borderTopColor: '#003087' }} />
      </div>
    )
  }

  return (
    <div className="bg-broadcast min-h-screen flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-56 shrink-0 flex flex-col"
        style={{ borderRight: '1px solid rgba(0,48,135,0.08)', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)' }}>
        <div className="p-5" style={{ borderBottom: '1px solid rgba(0,48,135,0.08)' }}>
          <p className="text-xs font-medium gold-text">Admin Panel</p>
          <p className="text-[10px] mt-0.5" style={{ color: 'rgba(0,26,84,0.3)' }}>Banswara Badri Ashara 1448</p>
        </div>

        <nav className="flex md:flex-col flex-row gap-1 p-3 flex-1">
          {navItems.map((item) => {
            const active = pathname === item.href
            return (
              <Link key={item.href} href={item.href}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all"
                style={{
                  background: active ? 'rgba(0,48,135,0.09)' : 'transparent',
                  color: active ? '#003087' : 'rgba(0,26,84,0.55)',
                  border: active ? '1px solid rgba(0,48,135,0.12)' : '1px solid transparent',
                }}>
                {item.icon}
                <span className="hidden md:inline">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-3" style={{ borderTop: '1px solid rgba(0,48,135,0.08)' }}>
          <button onClick={handleLogout}
            className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-sm transition-all"
            style={{ color: 'rgba(0,26,84,0.4)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#fca5a5' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(0,26,84,0.4)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
            </svg>
            <span className="hidden md:inline">Logout</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
    </div>
  )
}
