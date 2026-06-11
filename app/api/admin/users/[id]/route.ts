import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAdmin } from '@/lib/adminGuard'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = requireAdmin(req)
  if (guard) return guard

  const { id } = await params
  const { its_id, password } = await req.json()

  const updates: Record<string, string> = { updated_at: new Date().toISOString() }

  if (its_id) {
    if (!/^\d{8}$/.test(its_id.trim())) {
      return NextResponse.json({ error: 'ITS ID must be exactly 8 digits.' }, { status: 400 })
    }
    updates.its_id = its_id.trim()
  }

  if (password) {
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 })
    }
    updates.password_hash = await bcrypt.hash(password, 12)
    // Invalidate existing sessions when password changes
    updates.active_session_token = ''
  }

  const { data, error } = await supabaseAdmin
    .from('users')
    .update(updates)
    .eq('id', id)
    .select('id, its_id, updated_at')
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

  // Delete sessions first
  await supabaseAdmin.from('sessions').delete().eq('user_id', id)

  const { error } = await supabaseAdmin.from('users').delete().eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
