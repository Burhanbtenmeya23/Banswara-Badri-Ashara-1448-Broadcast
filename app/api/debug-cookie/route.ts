import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
  const cookieStore = await cookies()
  const authToken = cookieStore.get('auth_token')?.value

  // Also check raw cookie header
  const rawCookies = req.headers.get('cookie') ?? 'none'

  return NextResponse.json({
    authTokenExists: !!authToken,
    authTokenPreview: authToken ? authToken.slice(0, 20) + '...' : null,
    rawCookieHeader: rawCookies.slice(0, 200),
    allCookieNames: cookieStore.getAll().map(c => c.name),
  })
}
