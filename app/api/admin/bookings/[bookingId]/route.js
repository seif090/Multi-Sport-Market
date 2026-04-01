import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAdminUser } from '@/lib/admin'
import { recordAuditLog } from '@/lib/audit'
import { getPrisma } from '@/lib/prisma'
import { memoryStore } from '@/lib/store'
import { calculateAmountCents, overlaps } from '@/lib/scheduling'

export const runtime = 'nodejs'

const updateSchema = z.object({
  courtId: z.string().min(1),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
})

async function getCourt(prisma, courtId) {
  if (!prisma) {
    return memoryStore.courts.find((court) => court.id === courtId && court.isActive !== false) || null
  }

  return prisma.court.findUnique({ where: { id: courtId } }).then((court) => (court && court.isActive !== false ? court : null))
}

function hasConflict(bookings, bookingId, courtId, startsAt, endsAt) {
  return bookings.some((booking) => {
    if (booking.id === bookingId) return false
    if (booking.courtId !== courtId) return false
    if (booking.status === 'CANCELLED') return false
    return overlaps(new Date(startsAt), new Date(endsAt), new Date(booking.startsAt), new Date(booking.endsAt))
  })
}

export async function PATCH(request, { params }) {
  const admin = await getAdminUser()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = updateSchema.parse(await request.json())
    const prisma = getPrisma()
    const bookingId = params.bookingId
    const court = await getCourt(prisma, body.courtId)

    if (!court) {
      return NextResponse.json({ error: 'Court not found' }, { status: 404 })
    }

    if (!prisma) {
      const booking = memoryStore.bookings.find((item) => item.id === bookingId)
      if (!booking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
      }

      const conflicts = hasConflict(memoryStore.bookings, bookingId, body.courtId, body.startsAt, body.endsAt)
      if (conflicts) {
        return NextResponse.json({ error: 'Booking conflicts with an existing slot' }, { status: 409 })
      }

      booking.courtId = body.courtId
      booking.court = court
      booking.startsAt = body.startsAt
      booking.endsAt = body.endsAt
      booking.amountCents = calculateAmountCents(court, body.startsAt, body.endsAt)

      await recordAuditLog({
        actorId: admin.id,
        actorName: admin.name,
        actorRole: admin.role,
        action: 'UPDATE',
        entityType: 'BOOKING',
        entityId: booking.id,
        message: `تم إعادة جدولة الحجز الخاص بـ ${booking.customerName}`,
        metadata: {
          courtId: body.courtId,
          startsAt: body.startsAt,
          endsAt: body.endsAt,
        },
      })

      return NextResponse.json({ booking })
    }

    const existingBooking = await prisma.booking.findUnique({ where: { id: bookingId } })
    if (!existingBooking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    const conflicts = await prisma.booking.findMany({
      where: {
        id: { not: bookingId },
        courtId: body.courtId,
        status: { not: 'CANCELLED' },
      },
    })

    if (hasConflict(conflicts, bookingId, body.courtId, body.startsAt, body.endsAt)) {
      return NextResponse.json({ error: 'Booking conflicts with an existing slot' }, { status: 409 })
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        courtId: body.courtId,
        startsAt: new Date(body.startsAt),
        endsAt: new Date(body.endsAt),
        amountCents: calculateAmountCents(court, body.startsAt, body.endsAt),
      },
      include: { court: true },
    })

    await recordAuditLog({
      actorId: admin.id,
      actorName: admin.name,
      actorRole: admin.role,
      action: 'UPDATE',
      entityType: 'BOOKING',
      entityId: updatedBooking.id,
      message: `تم إعادة جدولة الحجز الخاص بـ ${updatedBooking.customerName}`,
      metadata: {
        courtId: body.courtId,
        startsAt: body.startsAt,
        endsAt: body.endsAt,
      },
    })

    return NextResponse.json({ booking: updatedBooking })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid booking update payload', issues: error.flatten() }, { status: 400 })
    }

    return NextResponse.json({ error: 'Unable to update booking' }, { status: 500 })
  }
}
