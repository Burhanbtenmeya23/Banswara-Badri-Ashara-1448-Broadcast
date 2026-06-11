import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserFromCookie } from '@/lib/auth'

export async function GET(req: NextRequest) {
  void req
  const payload = await getUserFromCookie()
  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify session is still valid
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('active_session_token')
    .eq('id', payload.userId)
    .single()

  if (!user || user.active_session_token !== payload.sessionToken) {
    return NextResponse.json({ error: 'session_terminated' }, { status: 401 })
  }

  const { data: settings } = await supabaseAdmin
    .from('settings')
    .select('youtube_video_id, youtube_url')
    .limit(1)
    .single()

  return NextResponse.json({ settings: settings ?? null })
}
