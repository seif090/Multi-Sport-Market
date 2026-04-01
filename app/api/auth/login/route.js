import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createSessionToken, SESSION_COOKIE, upsertUser } from '@/lib/auth'

export const runtime = 'nodejs'

const loginSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(8),
  role: z.enum(['VENDOR', 'TECHNICIAN', 'ADMIN']),
})

export async function POST(request) {
  try {
    const payload = loginSchema.parse(await request.json())
    const user = await upsertUser(payload)
    const token = createSessionToken(user)

    const response = NextResponse.json({
      user,
      redirectTo:
        user.role === 'ADMIN'
          ? '/dashboard/admin'
          : user.role === 'TECHNICIAN'
            ? '/dashboard/technicians'
            : '/dashboard/vendors',
    })

    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 14,
    })
    return response
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid login payload', issues: error.flatten() }, { status: 400 })
    }

    return NextResponse.json({ error: 'Unable to sign in' }, { status: 500 })
  }
}
