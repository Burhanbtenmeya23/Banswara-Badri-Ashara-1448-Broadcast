import { NextRequest, NextResponse } from 'next/server'

// Admin auth removed — all admin API routes are open
export function requireAdmin(_req: NextRequest): NextResponse | null {
  return null
}
