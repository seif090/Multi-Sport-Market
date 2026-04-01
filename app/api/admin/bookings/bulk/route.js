import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAdminUser } from '@/lib/admin'
import { getPrisma } from '@/lib/prisma'
import { memoryStore } from '@/lib/store'
import { findMatchingWaitlistEntries } from '@/lib/waitlist'
import { notifyWaitlistEntries } from '@/lib/notifications'

export const runtime = 'nodejs'

const bulkSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
  action: z.enum(['confirm', 'cancel']),
})

function nextStatus(action) {
  return action === 'confirm' ? 'CONFIRMED' : 'CANCELLED'
}

export async function POST(request) {
  const admin = await getAdminUser()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { ids, action } = bulkSchema.parse(await request.json())
    const status = nextStatus(action)
    const prisma = getPrisma()

    if (!prisma) {
      const updatedBookings = []
      const cancelledBookings = []
      memoryStore.bookings.forEach((booking) => {
        if (ids.includes(booking.id)) {
          booking.status = status
          updatedBookings.push(booking)
          if (status === 'CANCELLED') {
            cancelledBookings.push(booking)
          }
        }
      })

      for (const booking of cancelledBookings) {
        const court = memoryStore.courts.find((item) => item.id === booking.courtId) || null
        const matches = findMatchingWaitlistEntries(memoryStore.waitlistEntries, booking)
        matches.forEach((entry) => {
          entry.status = 'NOTIFIED'
          entry.notifiedAt = new Date().toISOString()
        })
        if (matches.length) {
          try {
            await notifyWaitlistEntries({
              entries: matches.map((entry) => ({ ...entry, court })),
              court,
              reason: 'available',
            })
          } catch (notifyError) {
            console.warn('waitlist notification failed', notifyError)
          }
        }
      }
      return NextResponse.json({ bookings: updatedBookings, action, status })
    }

    const bookingsToUpdate = await prisma.booking.findMany({
      where: { id: { in: ids } },
      include: { court: true },
    })

    const authorizedIds = bookingsToUpdate.map((booking) => booking.id)

    await prisma.booking.updateMany({
      where: { id: { in: authorizedIds } },
      data: { status },
    })

    const updatedBookings = await prisma.booking.findMany({
      where: { id: { in: authorizedIds } },
      include: { court: true },
      orderBy: { startsAt: 'asc' },
    })

    if (status === 'CANCELLED') {
      for (const booking of updatedBookings) {
        const matches = await prisma.waitlistEntry.findMany({
          where: {
            courtId: booking.courtId,
            status: 'WAITING',
            startsAt: { lt: booking.endsAt },
            endsAt: { gt: booking.startsAt },
          },
          include: { court: true },
          orderBy: { createdAt: 'asc' },
          take: 3,
        })

        if (!matches.length) continue

        await prisma.waitlistEntry.updateMany({
          where: { id: { in: matches.map((entry) => entry.id) } },
          data: {
            status: 'NOTIFIED',
            notifiedAt: new Date(),
          },
        })

        try {
          await notifyWaitlistEntries({
            entries: matches,
            court: booking.court,
            reason: 'available',
          })
        } catch (notifyError) {
          console.warn('waitlist notification failed', notifyError)
        }
      }
    }

    return NextResponse.json({ bookings: updatedBookings, action, status })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid bulk booking payload', issues: error.flatten() }, { status: 400 })
    }

    return NextResponse.json({ error: 'Unable to update bookings' }, { status: 500 })
  }
}
