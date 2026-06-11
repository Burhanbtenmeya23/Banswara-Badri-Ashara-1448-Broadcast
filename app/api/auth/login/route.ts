import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { signUserToken, generateSessionToken } from '@/lib/auth'
import { checkRateLimit } from '@/lib/ratelimit'

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown'
  const { allowed } = checkRateLimit(`login:${ip}`)

  if (!allowed) {
    return NextResponse.json({ error: 'Too many login attempts. Please try again in 15 minutes.' }, { status: 429 })
  }

  let body: { its_id?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const { its_id } = body

  if (!its_id) {
    return NextResponse.json({ error: 'ITS ID is required.' }, { status: 400 })
  }

  if (!/^\d{8}$/.test(its_id.trim())) {
    return NextResponse.json({ error: 'ITS ID must be exactly 8 digits.' }, { status: 400 })
  }

  const { data: user, error: dbError } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('its_id', its_id.trim())
    .single()

  if (dbError || !user) {
    return NextResponse.json({ error: 'ITS ID not found. Please contact the administrator.' }, { status: 401 })
  }

  const sessionToken = generateSessionToken()

  await supabaseAdmin
    .from('users')
    .update({ active_session_token: sessionToken, last_login: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', user.id)

  await supabaseAdmin.from('sessions').insert({
    user_id: user.id,
    token: sessionToken,
    ip_address: ip,
    created_at: new Date().toISOString(),
    last_seen: new Date().toISOString(),
  })

  try {
    const jwt = signUserToken({ userId: user.id, itsId: user.its_id, sessionToken })
    const response = NextResponse.json({ success: true, itsId: user.its_id })
    response.cookies.set('auth_token', jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
      path: '/',
    })
    return response
  } catch (err) {
    return NextResponse.json({ error: 'Token signing failed.', detail: String(err) }, { status: 500 })
  }
}
