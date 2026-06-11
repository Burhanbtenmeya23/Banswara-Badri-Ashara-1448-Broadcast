import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserFromCookie } from '@/lib/auth'

export async function GET(req: NextRequest) {
  void req
  const payload = await getUserFromCookie()
  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch the YouTube settings — no extra session check here, JWT is sufficient
  const { data: settings } = await supabaseAdmin
    .from('settings')
    .select('youtube_video_id, youtube_url')
    .limit(1)
    .single()

  return NextResponse.json({ settings: settings ?? null })
}
