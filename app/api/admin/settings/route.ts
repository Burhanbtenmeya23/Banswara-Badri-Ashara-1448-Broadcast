import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAdmin } from '@/lib/adminGuard'
import { extractVideoId } from '@/lib/youtube'

export async function GET(req: NextRequest) {
  const guard = requireAdmin(req)
  if (guard) return guard

  const { data } = await supabaseAdmin
    .from('settings')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single()

  return NextResponse.json({ settings: data ?? null })
}

export async function POST(req: NextRequest) {
  const guard = requireAdmin(req)
  if (guard) return guard

  const { youtube_url, broadcast_start_at, broadcast_end_at } = await req.json()

  const video_id = youtube_url ? extractVideoId(youtube_url) : null
  if (youtube_url && !video_id) {
    return NextResponse.json({ error: 'Invalid YouTube URL.' }, { status: 400 })
  }

  const { data: existing } = await supabaseAdmin
    .from('settings')
    .select('id')
    .limit(1)
    .single()

  const payload: Record<string, string | null> = {
    updated_at: new Date().toISOString(),
  }
  if (youtube_url !== undefined) {
    payload.youtube_url = youtube_url
    payload.youtube_video_id = video_id
  }
  if (broadcast_start_at !== undefined) payload.broadcast_start_at = broadcast_start_at || null
  if (broadcast_end_at !== undefined) payload.broadcast_end_at = broadcast_end_at || null

  let result
  if (existing) {
    result = await supabaseAdmin
      .from('settings')
      .update(payload)
      .eq('id', existing.id)
      .select()
      .single()
  } else {
    result = await supabaseAdmin
      .from('settings')
      .insert(payload)
      .select()
      .single()
  }

  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 })
  }

  return NextResponse.json({ settings: result.data })
}
