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
  isActive: z.coerce.boolean(),
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
    const target = prisma
      ? await prisma.user.findUnique({ where: { id: userId } })
      : memoryStore.users.find((item) => item.id === userId)

    if (!target) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (userId === admin.id && payload.isActive === false) {
      return NextResponse.json({ error: 'You cannot deactivate your own admin account' }, { status: 409 })
    }

    if (target.role === 'ADMIN' && payload.isActive === false) {
      if (!prisma) {
        const activeAdminCount = memoryStore.users.filter((item) => item.role === 'ADMIN' && item.isActive !== false).length
        if (target.isActive !== false && activeAdminCount <= 1) {
          return NextResponse.json({ error: 'You must keep at least one active admin account' }, { status: 409 })
        }
      } else {
        const activeAdminCount = await prisma.user.count({
          where: { role: 'ADMIN', isActive: true },
        })
        if (target.isActive !== false && activeAdminCount <= 1) {
          return NextResponse.json({ error: 'You must keep at least one active admin account' }, { status: 409 })
        }
      }
    }

    if (!prisma) {
      Object.assign(target, payload)
      return NextResponse.json({ user: target })
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

export async function DELETE(request, { params }) {
  const admin = await getAdminUser()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { userId } = await params
  const prisma = getPrisma()

  try {
    if (userId === admin.id) {
      return NextResponse.json({ error: 'You cannot deactivate your own admin account' }, { status: 409 })
    }

    if (!prisma) {
      const user = memoryStore.users.find((item) => item.id === userId)
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      if (user.role === 'ADMIN') {
        const adminCount = memoryStore.users.filter((item) => item.role === 'ADMIN').length
        if (adminCount <= 1) {
          return NextResponse.json({ error: 'You must keep at least one admin account' }, { status: 409 })
        }
      }

      user.isActive = false
      return NextResponse.json({ user })
    }

    const target = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!target) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (target.role === 'ADMIN') {
      const adminCount = await prisma.user.count({
        where: { role: 'ADMIN' },
      })
      if (adminCount <= 1) {
        return NextResponse.json({ error: 'You must keep at least one admin account' }, { status: 409 })
      }
    }

    const removed = await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    })

    return NextResponse.json({ user: removed })
  } catch (error) {
    return NextResponse.json({ error: 'Unable to update user status' }, { status: 500 })
  }
}
