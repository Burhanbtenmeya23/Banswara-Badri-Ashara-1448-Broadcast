import { NextRequest, NextResponse } from 'next/server'

// No server-side redirects — auth is handled client-side via /api/broadcast
export function middleware(_req: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [],
}
