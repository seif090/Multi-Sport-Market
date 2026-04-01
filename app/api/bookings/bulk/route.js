import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { getPrisma } from '@/lib/prisma'
import { memoryStore } from '@/lib/store'
import { SESSION_COOKIE, getUserFromSessionToken } from '@/lib/auth'

export const runtime = 'nodejs'

const bulkSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
  action: z.enum(['confirm', 'cancel']),
})

function nextStatus(action) {
  return action === 'confirm' ? 'CONFIRMED' : 'CANCELLED'
}

async function getCurrentUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null
  return getUserFromSessionToken(token)
}

function getBookingCourtVendorId(booking) {
  return booking.court?.vendorId || memoryStore.courts.find((court) => court.id === booking.courtId)?.vendorId || null
}

export async function POST(request) {
  const user = await getCurrentUser()
  if (!user || !['VENDOR', 'ADMIN'].includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { ids, action } = bulkSchema.parse(await request.json())
    const status = nextStatus(action)
    const prisma = getPrisma()

    if (!prisma) {
      const updatedBookings = []
      for (const booking of memoryStore.bookings) {
        if (!ids.includes(booking.id)) continue

        const courtVendorId = memoryStore.courts.find((court) => court.id === booking.courtId)?.vendorId || null
        if (user.role === 'VENDOR' && courtVendorId !== user.id) continue

        booking.status = status
        updatedBookings.push(booking)
      }

      return NextResponse.json({ bookings: updatedBookings, action, status })
    }

    const bookingsToUpdate = await prisma.booking.findMany({
      where: { id: { in: ids } },
      include: { court: true },
    })

    const authorizedIds = bookingsToUpdate
      .filter((booking) => user.role === 'ADMIN' || getBookingCourtVendorId(booking) === user.id)
      .map((booking) => booking.id)

    if (!authorizedIds.length) {
      return NextResponse.json({ error: 'No authorized bookings found' }, { status: 403 })
    }

    await prisma.booking.updateMany({
      where: { id: { in: authorizedIds } },
      data: { status },
    })

    const bookings = await prisma.booking.findMany({
      where: { id: { in: authorizedIds } },
      include: { court: true },
      orderBy: { startsAt: 'asc' },
    })

    return NextResponse.json({ bookings, action, status })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid bulk booking payload', issues: error.flatten() }, { status: 400 })
    }

    return NextResponse.json({ error: 'Unable to update bookings' }, { status: 500 })
  }
}
