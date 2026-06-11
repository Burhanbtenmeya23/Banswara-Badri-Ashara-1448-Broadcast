import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
  void req
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: settings } = await supabaseAdmin
    .from('settings')
    .select('youtube_video_id, youtube_url')
    .limit(1)
    .single()

  return NextResponse.json({ settings: settings ?? null })
}
