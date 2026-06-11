'use client'

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

  return (
    <div className="bg-broadcast min-h-screen flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-56 shrink-0 flex flex-col"
        style={{ borderRight: '1px solid rgba(201,168,76,0.1)', background: 'rgba(13,10,3,0.7)', backdropFilter: 'blur(10px)' }}>
        {/* Brand */}
        <div className="p-5" style={{ borderBottom: '1px solid rgba(201,168,76,0.1)' }}>
          <p className="text-xs font-medium gold-text">Admin Panel</p>
          <p className="text-[10px] mt-0.5" style={{ color: 'rgba(245,239,224,0.3)' }}>Banswara Badri Ashara 1448</p>
        </div>

        {/* Nav */}
        <nav className="flex md:flex-col flex-row gap-1 p-3 flex-1">
          {navItems.map((item) => {
            const active = pathname === item.href
            return (
              <Link key={item.href} href={item.href}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all"
                style={{
                  background: active ? 'rgba(201,168,76,0.12)' : 'transparent',
                  color: active ? '#c9a84c' : 'rgba(245,239,224,0.55)',
                  border: active ? '1px solid rgba(201,168,76,0.2)' : '1px solid transparent',
                }}>
                {item.icon}
                <span className="hidden md:inline">{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
    </div>
  )
}
