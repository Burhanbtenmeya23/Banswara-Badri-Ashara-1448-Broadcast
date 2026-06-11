import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Redirect already-logged-in users away from the login page
  if (pathname === '/') {
    const token = req.cookies.get('auth_token')?.value
    if (token) {
      return NextResponse.redirect(new URL('/broadcast', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/'],
}
