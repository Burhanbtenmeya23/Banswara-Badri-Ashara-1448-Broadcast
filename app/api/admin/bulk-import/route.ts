import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAdmin } from '@/lib/adminGuard'

interface CsvRow {
  its_id: string
  password: string
}

export async function POST(req: NextRequest) {
  const guard = requireAdmin(req)
  if (guard) return guard

  const { users }: { users: CsvRow[] } = await req.json()

  if (!Array.isArray(users) || users.length === 0) {
    return NextResponse.json({ error: 'No users provided.' }, { status: 400 })
  }

  if (users.length > 500) {
    return NextResponse.json({ error: 'Maximum 500 users per import.' }, { status: 400 })
  }

  const results = { success: 0, failed: 0, errors: [] as string[] }

  for (const row of users) {
    const its_id = String(row.its_id ?? '').trim()
    const password = String(row.password ?? '').trim()

    if (!/^\d{8}$/.test(its_id)) {
      results.failed++
      results.errors.push(`Invalid ITS ID: ${its_id}`)
      continue
    }

    if (password.length < 6) {
      results.failed++
      results.errors.push(`Password too short for ITS ID: ${its_id}`)
      continue
    }

    const password_hash = await bcrypt.hash(password, 12)

    const { error } = await supabaseAdmin
      .from('users')
      .upsert({ its_id, password_hash, updated_at: new Date().toISOString() }, {
        onConflict: 'its_id',
        ignoreDuplicates: false,
      })

    if (error) {
      results.failed++
      results.errors.push(`Failed for ITS ID ${its_id}: ${error.message}`)
    } else {
      results.success++
    }
  }

  return NextResponse.json(results)
}
