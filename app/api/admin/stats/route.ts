import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAdmin } from '@/lib/adminGuard'

export async function GET(req: NextRequest) {
  const guard = requireAdmin(req)
  if (guard) return guard

  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

  const [
    { count: totalUsers },
    { count: activeSessions },
    { data: onlineData },
    { data: recentLogins },
  ] = await Promise.all([
    supabaseAdmin.from('users').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('sessions').select('*', { count: 'exact', head: true })
      .gte('last_seen', fiveMinutesAgo),
    supabaseAdmin.from('sessions').select('user_id', { count: 'exact' })
      .gte('last_seen', fiveMinutesAgo),
    supabaseAdmin.from('users')
      .select('its_id, last_login')
      .not('last_login', 'is', null)
      .order('last_login', { ascending: false })
      .limit(10),
  ])

  const onlineUsers = new Set(onlineData?.map((s) => s.user_id) ?? []).size

  return NextResponse.json({
    totalUsers: totalUsers ?? 0,
    onlineUsers,
    activeSessions: activeSessions ?? 0,
    recentLogins: recentLogins ?? [],
  })
}
