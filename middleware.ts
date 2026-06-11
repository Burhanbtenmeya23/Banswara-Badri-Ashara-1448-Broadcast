import { NextRequest, NextResponse } from 'next/server'
import { verifyUserToken, verifyAdminToken } from '@/lib/auth'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Protect admin dashboard pages
  if (pathname.startsWith('/admin/dashboard')) {
    const adminToken = req.cookies.get('admin_token')?.value
    if (!adminToken || !verifyAdminToken(adminToken)) {
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }
    return NextResponse.next()
  }

  // Protect broadcast page
  if (pathname === '/broadcast') {
    const userToken = req.cookies.get('auth_token')?.value
    if (!userToken || !verifyUserToken(userToken)) {
      return NextResponse.redirect(new URL('/', req.url))
    }
    return NextResponse.next()
  }

  // Redirect logged-in users away from login page
  if (pathname === '/') {
    const userToken = req.cookies.get('auth_token')?.value
    if (userToken && verifyUserToken(userToken)) {
      return NextResponse.redirect(new URL('/broadcast', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/broadcast', '/admin/dashboard/:path*'],
}
