import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAdminUser } from '@/lib/admin'
import { getPrisma } from '@/lib/prisma'
import { memoryStore } from '@/lib/store'

export const runtime = 'nodejs'

const userSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(8),
  role: z.enum(['PLAYER', 'VENDOR', 'TECHNICIAN', 'ADMIN']),
})

export async function PUT(request, { params }) {
  const admin = await getAdminUser()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { userId } = await params

  try {
    const payload = userSchema.parse(await request.json())
    const prisma = getPrisma()

    if (!prisma) {
      const user = memoryStore.users.find((item) => item.id === userId)
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      Object.assign(user, payload)
      return NextResponse.json({ user })
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: payload,
    })

    return NextResponse.json({ user })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid user payload', issues: error.flatten() }, { status: 400 })
    }

    return NextResponse.json({ error: 'Unable to update user' }, { status: 500 })
  }
}
