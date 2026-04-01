import crypto from 'node:crypto'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPrisma } from './prisma'
import { memoryStore } from './store'

export const SESSION_COOKIE = 'msm_session'
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14

function getSecret() {
  return process.env.AUTH_SECRET || 'dev-only-secret-change-me'
}

function base64UrlEncode(text) {
  return Buffer.from(text).toString('base64url')
}

function base64UrlDecode(text) {
  return Buffer.from(text, 'base64url').toString('utf8')
}

function signPayload(payload) {
  return crypto.createHmac('sha256', getSecret()).update(payload).digest('base64url')
}

function parseToken(token) {
  const [encodedPayload, signature] = token.split('.')

  if (!encodedPayload || !signature) return null

  const expectedSignature = signPayload(encodedPayload)
  const signatureBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expectedSignature)

  if (signatureBuffer.length !== expectedBuffer.length) {
    return null
  }

  if (!crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return null
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload))
    if (!payload.exp || payload.exp < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

export function createSessionToken(user) {
  const payload = {
    sub: user.id,
    name: user.name,
    role: user.role,
    exp: Date.now() + SESSION_TTL_SECONDS * 1000,
  }
  const encodedPayload = base64UrlEncode(JSON.stringify(payload))
  const signature = signPayload(encodedPayload)
  return `${encodedPayload}.${signature}`
}

export function buildSessionCookie(token) {
  return {
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  }
}

export async function getUserFromSessionToken(token) {
  const session = parseToken(token)
  if (!session) return null

  const prisma = getPrisma()
  if (prisma) {
    const user = await prisma.user.findUnique({
      where: { id: session.sub },
    })
    return user ? { ...user, role: user.role } : null
  }

  const user = memoryStore.users.find((item) => item.id === session.sub)
  return user ? { ...user } : null
}

export async function getCurrentUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null
  return getUserFromSessionToken(token)
}

export async function requireUser() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  return user
}

export async function requireRole(allowedRoles) {
  const user = await requireUser()
  if (!allowedRoles.includes(user.role)) {
    redirect('/login?reason=role')
  }
  return user
}

export async function getUserByPhone(phone) {
  const prisma = getPrisma()
  if (prisma) {
    return prisma.user.findUnique({ where: { phone } })
  }
  return memoryStore.users.find((user) => user.phone === phone) || null
}

export async function upsertUser({ name, phone, role }) {
  const prisma = getPrisma()
  if (prisma) {
    return prisma.user.upsert({
      where: { phone },
      update: { name, role },
      create: { name, phone, role },
    })
  }

  const existing = memoryStore.users.find((user) => user.phone === phone)
  if (existing) {
    existing.name = name
    existing.role = role
    return existing
  }

  const user = {
    id: `user-${Date.now()}`,
    name,
    phone,
    role,
  }
  memoryStore.users.unshift(user)
  return user
}

export async function findUserById(id) {
  const prisma = getPrisma()
  if (prisma) {
    return prisma.user.findUnique({ where: { id } })
  }
  return memoryStore.users.find((user) => user.id === id) || null
}

export function isAllowedRole(role, allowedRoles) {
  return allowedRoles.includes(role)
}
