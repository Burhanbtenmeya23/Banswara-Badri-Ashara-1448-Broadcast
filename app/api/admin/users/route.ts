import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAdmin } from '@/lib/adminGuard'

export async function GET(req: NextRequest) {
  const guard = requireAdmin(req)
  if (guard) return guard

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') ?? ''
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = 20
  const offset = (page - 1) * limit

  let query = supabaseAdmin
    .from('users')
    .select('id, its_id, created_at, updated_at, last_login, active_session_token', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (search) {
    query = query.ilike('its_id', `%${search}%`)
  }

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ users: data, total: count, page, limit })
}

export async function POST(req: NextRequest) {
  const guard = requireAdmin(req)
  if (guard) return guard

  const { its_id, password } = await req.json()

  if (!its_id || !password) {
    return NextResponse.json({ error: 'ITS ID and password are required.' }, { status: 400 })
  }

  if (!/^\d{8}$/.test(its_id.trim())) {
    return NextResponse.json({ error: 'ITS ID must be exactly 8 digits.' }, { status: 400 })
  }

  if (password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 })
  }

  const password_hash = await bcrypt.hash(password, 12)

  const { data, error } = await supabaseAdmin
    .from('users')
    .insert({ its_id: its_id.trim(), password_hash })
    .select('id, its_id, created_at')
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'ITS ID already exists.' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ user: data }, { status: 201 })
}
