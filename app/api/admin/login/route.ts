import { NextRequest, NextResponse } from 'next/server'
import { signAdminToken } from '@/lib/auth'
import { checkRateLimit } from '@/lib/ratelimit'

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
  const { allowed } = checkRateLimit(`admin_login:${ip}`)

  if (!allowed) {
    return NextResponse.json({ error: 'Too many attempts.' }, { status: 429 })
  }

  let body: { username?: string; password?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.', step: 'parse' }, { status: 400 })
  }

  const { username, password } = body

  const envUsername = process.env.ADMIN_USERNAME
  const envPassword = process.env.ADMIN_PASSWORD

  // Detailed mismatch info for debugging
  if (username !== envUsername || password !== envPassword) {
    return NextResponse.json({
      error: 'Invalid credentials.',
      debug: {
        usernameMatch: username === envUsername,
        passwordMatch: password === envPassword,
        envUsernameExists: !!envUsername,
        envPasswordExists: !!envPassword,
        receivedUsername: username,
      },
    }, { status: 401 })
  }

  try {
    const token = signAdminToken({ admin: true, username: username! })
    const response = NextResponse.json({ success: true })
    response.cookies.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 8,
      path: '/',
    })
    return response
  } catch (err) {
    return NextResponse.json({
      error: 'Token signing failed.',
      detail: String(err),
      jwtSecretExists: !!process.env.ADMIN_JWT_SECRET,
    }, { status: 500 })
  }
}
