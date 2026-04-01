import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { SESSION_COOKIE, getUserFromSessionToken } from '@/lib/auth'

export const runtime = 'nodejs'

export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value

  if (!token) {
    return NextResponse.json({ user: null })
  }

  const user = await getUserFromSessionToken(token)
  return NextResponse.json({ user })
}
