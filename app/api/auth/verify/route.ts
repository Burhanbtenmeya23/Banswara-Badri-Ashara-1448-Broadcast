import { NextRequest, NextResponse } from 'next/server'
import { getUserFromCookie } from '@/lib/auth'

export async function GET(req: NextRequest) {
  void req
  const payload = await getUserFromCookie()
  if (!payload) {
    return NextResponse.json({ valid: false, reason: 'no_token' }, { status: 401 })
  }

  // JWT is valid — trust it without extra Supabase round-trip
  return NextResponse.json({ valid: true, itsId: payload.itsId })
}
