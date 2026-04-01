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

export async function DELETE(request, { params }) {
  const admin = await getAdminUser()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { userId } = await params
  const prisma = getPrisma()

  try {
    if (userId === admin.id) {
      return NextResponse.json({ error: 'You cannot delete your own admin account' }, { status: 409 })
    }

    if (!prisma) {
      const userIndex = memoryStore.users.findIndex((item) => item.id === userId)
      if (userIndex === -1) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      const target = memoryStore.users[userIndex]
      if (target.role === 'ADMIN') {
        const adminCount = memoryStore.users.filter((item) => item.role === 'ADMIN').length
        if (adminCount <= 1) {
          return NextResponse.json({ error: 'You must keep at least one admin account' }, { status: 409 })
        }
      }

      const linkedCourt = memoryStore.courts.some((court) => court.vendorId === userId)
      const linkedBookings = memoryStore.bookings.some((booking) => booking.userId === userId)
      const linkedJobs = memoryStore.maintenanceJobs.some(
        (job) => job.vendorId === userId || job.technicianId === userId
      )

      if (linkedCourt || linkedBookings || linkedJobs) {
        return NextResponse.json({ error: 'Cannot delete a user with linked records' }, { status: 409 })
      }

      const [removed] = memoryStore.users.splice(userIndex, 1)
      return NextResponse.json({ user: removed })
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

    const [linkedCourt, linkedBookings, linkedJobs] = await Promise.all([
      prisma.court.count({ where: { vendorId: userId } }),
      prisma.booking.count({ where: { userId } }),
      prisma.maintenanceJob.count({
        where: {
          OR: [{ vendorId: userId }, { technicianId: userId }],
        },
      }),
    ])

    if (linkedCourt > 0 || linkedBookings > 0 || linkedJobs > 0) {
      return NextResponse.json({ error: 'Cannot delete a user with linked records' }, { status: 409 })
    }

    const removed = await prisma.user.delete({
      where: { id: userId },
    })

    return NextResponse.json({ user: removed })
  } catch (error) {
    return NextResponse.json({ error: 'Unable to delete user' }, { status: 500 })
  }
}
