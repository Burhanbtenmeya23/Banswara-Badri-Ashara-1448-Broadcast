import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { checkRateLimit } from '@/lib/ratelimit'

// Generate a deterministic token from credentials — no JWT needed
function makeAdminToken(username: string, password: string): string {
  const secret = process.env.ADMIN_JWT_SECRET ?? process.env.JWT_SECRET ?? 'banswara-admin-fallback-secret'
  return createHmac('sha256', secret).update(`${username}:${password}`).digest('hex')
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
  const { allowed } = checkRateLimit(`admin_login:${ip}`)

  if (!allowed) {
    return NextResponse.json({ error: 'Too many attempts. Please wait 15 minutes.' }, { status: 429 })
  }

  let body: { username?: string; password?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const { username, password } = body

  if (!username || !password) {
    return NextResponse.json({ error: 'Username and password are required.' }, { status: 400 })
  }

  if (username !== process.env.ADMIN_USERNAME || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 })
  }

  const token = makeAdminToken(username, password)

  const response = NextResponse.json({ success: true })
  response.cookies.set('admin_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 8, // 8 hours
    path: '/',
  })

  return response
}
