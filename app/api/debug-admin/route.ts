import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    usernameExists: !!process.env.ADMIN_USERNAME,
    passwordExists: !!process.env.ADMIN_PASSWORD,
    username: process.env.ADMIN_USERNAME,
  })
}
