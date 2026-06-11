import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import BroadcastClient from '@/components/BroadcastClient'

export const dynamic = 'force-dynamic'

export default async function BroadcastPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value

  if (!token) {
    redirect('/')
  }

  return <BroadcastClient />
}
