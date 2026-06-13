import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { getUserFromCookie } from '@/lib/auth'

export async function GET(req: NextRequest) {
  void req
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await getUserFromCookie()
  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [settingsResult, userResult] = await Promise.all([
    supabaseAdmin
      .from('settings')
      .select('youtube_video_id, youtube_url, broadcast_start_at, broadcast_end_at')
      .limit(1)
      .single(),
    supabaseAdmin
      .from('users')
      .select('audio_only')
      .eq('id', payload.userId)
      .single(),
  ])

  return NextResponse.json({
    settings: settingsResult.data ?? null,
    audioOnly: userResult.data?.audio_only ?? false,
  })
}
