import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'

function makeAdminToken(username: string, password: string): string {
  const secret = process.env.ADMIN_JWT_SECRET ?? process.env.JWT_SECRET ?? 'banswara-admin-fallback-secret'
  return createHmac('sha256', secret).update(`${username}:${password}`).digest('hex')
}

function isValidAdminToken(token: string): boolean {
  const username = process.env.ADMIN_USERNAME
  const password = process.env.ADMIN_PASSWORD
  if (!username || !password) return false
  const expected = makeAdminToken(username, password)
  return token === expected
}

export function requireAdmin(req: NextRequest): NextResponse | null {
  const token = req.cookies.get('admin_token')?.value
  if (!token || !isValidAdminToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}
