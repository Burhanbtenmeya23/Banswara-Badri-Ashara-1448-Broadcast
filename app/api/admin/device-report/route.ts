import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAdmin } from '@/lib/adminGuard'

// Classify a User-Agent string into a simple device category
function classifyDevice(ua: string): string {
  if (!ua) return 'Unknown'
  const s = ua.toLowerCase()

  // Smart TVs — check before Android/Chrome to avoid misclassifying Android TV
  if (s.includes('tizen')) return 'Samsung TV'
  if (s.includes('webos')) return 'LG TV'
  if (s.includes('viera') || s.includes('panasonic')) return 'Panasonic TV'
  if (s.includes('hbbtv') || s.includes('netcast') || s.includes('smart-tv')) return 'Smart TV'
  if (s.includes('android tv') || s.includes('googletv') || s.includes('crkey')) return 'Android TV / Chromecast'
  if (s.includes('firetv') || s.includes('fire tv') || s.includes('silk')) return 'Amazon Fire TV'
  if (s.includes('roku')) return 'Roku'
  if (s.includes('appletv') || s.includes('apple tv')) return 'Apple TV'

  // Tablets before phones
  if (s.includes('ipad')) return 'iPad'
  if (s.includes('android') && s.includes('tablet')) return 'Android Tablet'

  // Phones
  if (s.includes('iphone') || s.includes('ipod')) return 'iPhone'
  if (s.includes('android') && s.includes('mobile')) return 'Android Phone'
  if (s.includes('android')) return 'Android Phone'

  // Desktop
  if (s.includes('macintosh') || s.includes('mac os x')) return 'Mac'
  if (s.includes('windows')) return 'Windows PC'
  if (s.includes('linux') || s.includes('x11')) return 'Linux'

  return 'Unknown'
}

function classifyBrowser(ua: string): string {
  if (!ua) return 'Unknown'
  const s = ua.toLowerCase()
  if (s.includes('samsungbrowser')) return 'Samsung Browser'
  if (s.includes('edg/')) return 'Edge'
  if (s.includes('firefox')) return 'Firefox'
  if (s.includes('opr/') || s.includes('opera')) return 'Opera'
  if (s.includes('chrome') && !s.includes('chromium')) return 'Chrome'
  if (s.includes('safari') && !s.includes('chrome')) return 'Safari'
  if (s.includes('chromium')) return 'Chromium'
  return 'Unknown'
}

export async function GET(req: NextRequest) {
  const guard = requireAdmin(req)
  if (guard) return guard

  // Fetch all sessions joined with user its_id
  const { data: sessions, error } = await supabaseAdmin
    .from('sessions')
    .select('user_id, user_agent, ip_address, created_at, last_seen, users(its_id)')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Build per-user aggregated report
  const userMap = new Map<string, {
    its_id: string
    total_logins: number
    last_seen: string
    devices: Record<string, number>
    browsers: Record<string, number>
    ips: Set<string>
  }>()

  for (const s of sessions ?? []) {
    const usersField = s.users as unknown as { its_id: string } | null
    const itsId = usersField?.its_id ?? 'unknown'
    const device = classifyDevice(s.user_agent ?? '')
    const browser = classifyBrowser(s.user_agent ?? '')

    if (!userMap.has(s.user_id)) {
      userMap.set(s.user_id, {
        its_id: itsId,
        total_logins: 0,
        last_seen: s.last_seen,
        devices: {},
        browsers: {},
        ips: new Set(),
      })
    }

    const entry = userMap.get(s.user_id)!
    entry.total_logins++
    entry.devices[device] = (entry.devices[device] ?? 0) + 1
    entry.browsers[browser] = (entry.browsers[browser] ?? 0) + 1
    if (s.ip_address) entry.ips.add(s.ip_address)
    if (s.last_seen > entry.last_seen) entry.last_seen = s.last_seen
  }

  const report = Array.from(userMap.values())
    .map(e => ({
      its_id: e.its_id,
      total_logins: e.total_logins,
      last_seen: e.last_seen,
      devices: e.devices,
      browsers: e.browsers,
      unique_ips: e.ips.size,
    }))
    .sort((a, b) => b.total_logins - a.total_logins)

  // Summary totals
  const allDevices: Record<string, number> = {}
  const allBrowsers: Record<string, number> = {}
  for (const row of report) {
    for (const [d, c] of Object.entries(row.devices)) allDevices[d] = (allDevices[d] ?? 0) + c
    for (const [b, c] of Object.entries(row.browsers)) allBrowsers[b] = (allBrowsers[b] ?? 0) + c
  }

  return NextResponse.json({ report, summary: { devices: allDevices, browsers: allBrowsers } })
}
