import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserFromCookie } from '@/lib/auth'

export async function GET(req: NextRequest) {
  void req
  const payload = await getUserFromCookie()
  if (!payload) {
    return NextResponse.json({ valid: false, reason: 'no_token' }, { status: 401 })
  }

  // Check if the session token in DB matches the token in JWT
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('active_session_token')
    .eq('id', payload.userId)
    .single()

  if (!user || user.active_session_token !== payload.sessionToken) {
    return NextResponse.json({ valid: false, reason: 'session_terminated' }, { status: 401 })
  }

  // Update last_seen on sessions table
  await supabaseAdmin
    .from('sessions')
    .update({ last_seen: new Date().toISOString() })
    .eq('token', payload.sessionToken)

  return NextResponse.json({ valid: true, itsId: payload.itsId })
}
