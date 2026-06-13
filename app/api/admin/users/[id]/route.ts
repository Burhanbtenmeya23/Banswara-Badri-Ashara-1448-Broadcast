import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAdmin } from '@/lib/adminGuard'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = requireAdmin(req)
  if (guard) return guard

  const { id } = await params
  const body = await req.json()

  const updates: Record<string, string | boolean> = { updated_at: new Date().toISOString() }

  if (body.its_id) {
    if (!/^\d{8}$/.test(body.its_id.trim())) {
      return NextResponse.json({ error: 'ITS ID must be exactly 8 digits.' }, { status: 400 })
    }
    updates.its_id = body.its_id.trim()
  }

  if (typeof body.audio_only === 'boolean') {
    updates.audio_only = body.audio_only
  }

  const { data, error } = await supabaseAdmin
    .from('users')
    .update(updates)
    .eq('id', id)
    .select('id, its_id, audio_only, updated_at')
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'ITS ID already exists.' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ user: data })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = requireAdmin(req)
  if (guard) return guard

  const { id } = await params

  await supabaseAdmin.from('sessions').delete().eq('user_id', id)

  const { error } = await supabaseAdmin.from('users').delete().eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
