import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/lib/supabase'
import { signUserToken, generateSessionToken } from '@/lib/auth'
import { checkRateLimit } from '@/lib/ratelimit'

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown'
  const rateLimitKey = `login:${ip}`
  const { allowed } = checkRateLimit(rateLimitKey)

  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many login attempts. Please try again in 15 minutes.' },
      { status: 429 }
    )
  }

  let body: { its_id?: string; password?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const { its_id, password } = body

  if (!its_id || !password) {
    return NextResponse.json({ error: 'ITS ID and password are required.' }, { status: 400 })
  }

  // Sanitize: ITS ID should be alphanumeric only
  if (!/^\d{8}$/.test(its_id.trim())) {
    return NextResponse.json({ error: 'Invalid ITS ID format.' }, { status: 400 })
  }

  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('its_id', its_id.trim())
    .single()

  if (error || !user) {
    return NextResponse.json({ error: 'Invalid ITS ID or password.' }, { status: 401 })
  }

  const passwordMatch = await bcrypt.compare(password, user.password_hash)
  if (!passwordMatch) {
    return NextResponse.json({ error: 'Invalid ITS ID or password.' }, { status: 401 })
  }

  // Generate a new unique session token (invalidates previous sessions)
  const sessionToken = generateSessionToken()

  // Update user's active session token and last login
  await supabaseAdmin
    .from('users')
    .update({
      active_session_token: sessionToken,
      last_login: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  // Record session in sessions table
  await supabaseAdmin.from('sessions').insert({
    user_id: user.id,
    token: sessionToken,
    ip_address: ip,
    created_at: new Date().toISOString(),
    last_seen: new Date().toISOString(),
  })

  const jwt = signUserToken({
    userId: user.id,
    itsId: user.its_id,
    sessionToken,
  })

  const response = NextResponse.json({ success: true, itsId: user.its_id })
  response.cookies.set('auth_token', jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  })

  return response
}
