import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAdmin } from '@/lib/adminGuard'

function extractVideoId(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname === 'youtu.be') return u.pathname.slice(1)
    if (u.hostname.includes('youtube.com')) {
      return u.searchParams.get('v')
    }
    return null
  } catch {
    return null
  }
}

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

  const { youtube_url } = await req.json()

  if (!youtube_url) {
    return NextResponse.json({ error: 'YouTube URL is required.' }, { status: 400 })
  }

  const video_id = extractVideoId(youtube_url)
  if (!video_id) {
    return NextResponse.json({ error: 'Invalid YouTube URL.' }, { status: 400 })
  }

  // Upsert single settings row
  const { data: existing } = await supabaseAdmin
    .from('settings')
    .select('id')
    .limit(1)
    .single()

  let result
  if (existing) {
    result = await supabaseAdmin
      .from('settings')
      .update({
        youtube_url,
        youtube_video_id: video_id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single()
  } else {
    result = await supabaseAdmin
      .from('settings')
      .insert({
        youtube_url,
        youtube_video_id: video_id,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()
  }

  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 })
  }

  return NextResponse.json({ settings: result.data })
}
