import { cookies } from 'next/headers'
import { SESSION_COOKIE, getUserFromSessionToken } from './auth'

export async function getAdminUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null
  const user = await getUserFromSessionToken(token)
  return user && user.role === 'ADMIN' ? user : null
}
