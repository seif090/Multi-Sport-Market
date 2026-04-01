import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getPrisma } from '@/lib/prisma'
import { memoryStore } from '@/lib/store'
import { notifyWaitlistEntries } from '@/lib/notifications'
import { calculateAmountCents, expandRecurrence, overlaps } from '@/lib/scheduling'

export const runtime = 'nodejs'

const bookingSchema = z.object({
  courtId: z.string().min(1),
  customerName: z.string().min(2),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().min(8),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  notes: z.string().optional(),
  repeatPattern: z.enum(['NONE', 'DAILY', 'WEEKLY']).default('NONE'),
  repeatCount: z.coerce.number().int().min(1).max(12).default(1),
  joinWaitlist: z.boolean().default(false),
})

function isConflict(existingBookings, occurrence) {
  return existingBookings.some((booking) => {
    return overlaps(new Date(occurrence.startsAt), new Date(occurrence.endsAt), new Date(booking.startsAt), new Date(booking.endsAt))
  })
}

function buildBookingRecord(court, body, occurrence, occurrenceIndex) {
  return {
    courtId: body.courtId,
    customerName: body.customerName,
    email: body.email?.trim() || null,
    phone: body.phone,
    startsAt: occurrence.startsAt,
    endsAt: occurrence.endsAt,
    notes: body.notes,
    amountCents: calculateAmountCents(court, occurrence.startsAt, occurrence.endsAt),
    seriesId: occurrence.seriesId,
    repeatPattern: occurrence.repeatPattern,
    repeatCount: occurrence.repeatCount,
    occurrenceIndex,
  }
}

function buildWaitlistRecord(body, occurrence, occurrenceIndex) {
  return {
    courtId: body.courtId,
    customerName: body.customerName,
    email: body.email?.trim() || null,
    phone: body.phone,
    startsAt: occurrence.startsAt,
    endsAt: occurrence.endsAt,
    notes: body.notes,
    seriesId: occurrence.seriesId,
    repeatPattern: occurrence.repeatPattern,
    repeatCount: occurrence.repeatCount,
    occurrenceIndex,
  }
}

function createMemoryBooking(court, body, occurrence, occurrenceIndex) {
  return {
    id: `booking-${Date.now()}-${occurrenceIndex}`,
    ...buildBookingRecord(court, body, occurrence, occurrenceIndex),
    court,
    status: 'PENDING',
  }
}

function createMemoryWaitlistEntry(body, occurrence, occurrenceIndex) {
  return {
    id: `wait-${Date.now()}-${occurrenceIndex}`,
    ...buildWaitlistRecord(body, occurrence, occurrenceIndex),
    status: 'WAITING',
    notifiedAt: null,
    convertedBookingId: null,
  }
}

export async function GET() {
  const prisma = getPrisma()

  if (!prisma) {
    return NextResponse.json({ bookings: memoryStore.bookings })
  }

  try {
    const bookings = await prisma.booking.findMany({
      include: { court: true },
      orderBy: { startsAt: 'asc' },
      take: 50,
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
    const court = prisma
      ? await prisma.court.findUnique({ where: { id: body.courtId } })
      : memoryStore.courts.find((item) => item.id === body.courtId) || null

    if (!court || court.isActive === false) {
      return NextResponse.json({ error: 'Court not found' }, { status: 404 })
    }

    const occurrences = expandRecurrence({
      startsAt: body.startsAt,
      endsAt: body.endsAt,
      repeatPattern: body.repeatPattern,
      repeatCount: body.repeatCount,
    })

    const existingBookings = prisma
      ? await prisma.booking.findMany({
          where: {
            courtId: body.courtId,
            status: { not: 'CANCELLED' },
          },
        })
      : memoryStore.bookings.filter((booking) => booking.courtId === body.courtId && booking.status !== 'CANCELLED')

    const conflicts = occurrences.filter((occurrence) => isConflict(existingBookings, occurrence))

    if (conflicts.length > 0 && !body.joinWaitlist) {
      return NextResponse.json(
        {
          error: 'Court is already booked for one or more selected times.',
          conflicts: conflicts.map((occurrence) => ({
            startsAt: occurrence.startsAt.toISOString(),
            endsAt: occurrence.endsAt.toISOString(),
          })),
        },
        { status: 409 }
      )
    }

    if (!prisma) {
      const createdBookings = []
      const waitlistEntries = []

      occurrences.forEach((occurrence, occurrenceIndex) => {
        if (isConflict(existingBookings, occurrence)) {
          if (body.joinWaitlist) {
            const waitlistEntry = createMemoryWaitlistEntry(body, occurrence, occurrenceIndex)
            memoryStore.waitlistEntries.unshift(waitlistEntry)
            waitlistEntries.push(waitlistEntry)
          }
          return
        }

        const booking = createMemoryBooking(court, body, occurrence, occurrenceIndex)
        memoryStore.bookings.push(booking)
        createdBookings.push(booking)
      })

      if (waitlistEntries.length) {
        try {
          await notifyWaitlistEntries({
            entries: waitlistEntries.map((entry) => ({ ...entry, court })),
            court,
            reason: 'added',
          })
        } catch (notifyError) {
          console.warn('waitlist notification failed', notifyError)
        }
      }

      return NextResponse.json(
        {
          bookings: createdBookings,
          waitlistEntries,
          recurring: body.repeatPattern !== 'NONE',
        },
        { status: createdBookings.length ? 201 : 202 }
      )
    }

    const createdBookings = []
    const waitlistEntries = []

    for (const occurrence of occurrences) {
      const occurrenceIndex = occurrence.occurrenceIndex
        if (isConflict(existingBookings, occurrence)) {
          if (body.joinWaitlist) {
            waitlistEntries.push({
              courtId: body.courtId,
              customerName: body.customerName,
              email: body.email?.trim() || null,
              phone: body.phone,
              startsAt: occurrence.startsAt,
            endsAt: occurrence.endsAt,
            notes: body.notes,
            seriesId: occurrence.seriesId,
            repeatPattern: occurrence.repeatPattern,
            repeatCount: occurrence.repeatCount,
          })
        }
        continue
      }

      createdBookings.push({
        courtId: body.courtId,
        customerName: body.customerName,
        phone: body.phone,
        startsAt: occurrence.startsAt,
        endsAt: occurrence.endsAt,
        notes: body.notes,
        amountCents: calculateAmountCents(court, occurrence.startsAt, occurrence.endsAt),
        seriesId: occurrence.seriesId,
        repeatPattern: occurrence.repeatPattern,
        repeatCount: occurrence.repeatCount,
        occurrenceIndex,
      })
    }

    if (createdBookings.length === 0 && waitlistEntries.length === 0) {
      return NextResponse.json({ error: 'Court is already booked for the selected time.' }, { status: 409 })
    }

    await prisma.$transaction(async (tx) => {
      for (const booking of createdBookings) {
        await tx.booking.create({ data: booking })
      }

      for (const waitlistEntry of waitlistEntries) {
        await tx.waitlistEntry.create({
          data: {
            ...waitlistEntry,
            status: 'WAITING',
          },
        })
      }
    })

    const seriesId = occurrences[0]?.seriesId
    const [created, createdWaitlistEntries] = await Promise.all([
      prisma.booking.findMany({
        where: { seriesId },
        include: { court: true },
        orderBy: { startsAt: 'asc' },
      }),
      prisma.waitlistEntry.findMany({
        where: { seriesId },
        include: { court: true },
        orderBy: { startsAt: 'asc' },
      }),
    ])

    if (createdWaitlistEntries.length) {
      try {
        await notifyWaitlistEntries({
          entries: createdWaitlistEntries,
          court,
          reason: 'added',
        })
      } catch (notifyError) {
        console.warn('waitlist notification failed', notifyError)
      }
    }

    return NextResponse.json(
      {
        bookings: created.length ? created : [],
        waitlistEntries: createdWaitlistEntries,
        recurring: body.repeatPattern !== 'NONE',
      },
      { status: created.length ? 201 : 202 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid booking payload', issues: error.flatten() }, { status: 400 })
    }

    return NextResponse.json({ error: 'Unable to create booking' }, { status: 500 })
  }
}
