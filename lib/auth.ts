import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

const JWT_SECRET = process.env.JWT_SECRET!
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET!

export interface UserPayload {
  userId: string
  itsId: string
  sessionToken: string
}

export interface AdminPayload {
  admin: true
  username: string
}

export function signUserToken(payload: UserPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' })
}

export function verifyUserToken(token: string): UserPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserPayload
  } catch {
    return null
  }
}

export function signAdminToken(payload: AdminPayload): string {
  return jwt.sign(payload, ADMIN_JWT_SECRET, { expiresIn: '8h' })
}

export function verifyAdminToken(token: string): AdminPayload | null {
  try {
    return jwt.verify(token, ADMIN_JWT_SECRET) as AdminPayload
  } catch {
    return null
  }
}

export async function getUserFromCookie(): Promise<UserPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  if (!token) return null
  return verifyUserToken(token)
}

export async function getAdminFromCookie(): Promise<AdminPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value
  if (!token) return null
  return verifyAdminToken(token)
}

export function generateSessionToken(): string {
  return crypto.randomUUID() + '-' + Date.now()
}
