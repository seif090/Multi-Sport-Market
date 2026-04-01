import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getPrisma } from '@/lib/prisma'
import { memoryStore } from '@/lib/store'

export const runtime = 'nodejs'

const bookingSchema = z.object({
  courtId: z.string().min(1),
  customerName: z.string().min(2),
  phone: z.string().min(8),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  notes: z.string().optional(),
})

export async function GET() {
  const prisma = getPrisma()

  if (!prisma) {
    return NextResponse.json({ bookings: memoryStore.bookings })
  }

  try {
    const bookings = await prisma.booking.findMany({
      include: { court: true },
      orderBy: { startsAt: 'asc' },
      take: 20,
    })

    return NextResponse.json({ bookings })
  } catch {
    return NextResponse.json({ bookings: memoryStore.bookings })
  }
}

export async function POST(request) {
  try {
    const body = bookingSchema.parse(await request.json())
    const prisma = getPrisma()

    if (!prisma) {
      const overlap = memoryStore.bookings.find((booking) => {
        return (
          booking.courtId === body.courtId &&
          booking.status !== 'CANCELLED' &&
          new Date(booking.startsAt) < new Date(body.endsAt) &&
          new Date(booking.endsAt) > new Date(body.startsAt)
        )
      })

      if (overlap) {
        return NextResponse.json({ error: 'Court is already booked for the selected time.' }, { status: 409 })
      }

      const court = memoryStore.courts.find((item) => item.id === body.courtId)
      const booking = {
        id: `booking-${Date.now()}`,
        ...body,
        court,
        status: 'PENDING',
        startsAt: body.startsAt,
        endsAt: body.endsAt,
      }
      memoryStore.bookings.push(booking)
      return NextResponse.json({ booking }, { status: 201 })
    }

    const overlap = await prisma.booking.findFirst({
      where: {
        courtId: body.courtId,
        status: { not: 'CANCELLED' },
        AND: [{ startsAt: { lt: new Date(body.endsAt) } }, { endsAt: { gt: new Date(body.startsAt) } }],
      },
    })

    if (overlap) {
      return NextResponse.json({ error: 'Court is already booked for the selected time.' }, { status: 409 })
    }

    const booking = await prisma.booking.create({
      data: {
        courtId: body.courtId,
        customerName: body.customerName,
        phone: body.phone,
        startsAt: new Date(body.startsAt),
        endsAt: new Date(body.endsAt),
        notes: body.notes,
      },
    })

    return NextResponse.json({ booking }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid booking payload', issues: error.flatten() }, { status: 400 })
    }

    return NextResponse.json({ error: 'Unable to create booking' }, { status: 500 })
  }
}
