import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAdmin } from '@/lib/adminGuard'

export async function POST(req: NextRequest) {
  const guard = requireAdmin(req)
  if (guard) return guard

  const now = new Date().toISOString()

  const { error } = await supabaseAdmin
    .from('settings')
    .update({ force_refresh_at: now })
    .not('id', 'is', null)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ force_refresh_at: now })
}
