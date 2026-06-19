import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserFromCookie } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
  void req
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const payload = await getUserFromCookie()
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabaseAdmin
    .from('settings')
    .select('force_refresh_at')
    .limit(1)
    .single()

  return NextResponse.json({ force_refresh_at: data?.force_refresh_at ?? null })
}
