import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAdminUser } from '@/lib/admin'
import { getPrisma } from '@/lib/prisma'
import { memoryStore } from '@/lib/store'
import { calculateAmountCents } from '@/lib/scheduling'
import { notifyWaitlistEntries } from '@/lib/notifications'
import { recordAuditLog } from '@/lib/audit'

export const runtime = 'nodejs'

const bulkSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
  action: z.enum(['notify', 'expire', 'convert']),
})

async function getCourt(prisma, courtId) {
  if (!prisma) {
    return memoryStore.courts.find((court) => court.id === courtId && court.isActive !== false) || null
  }

  const court = await prisma.court.findUnique({ where: { id: courtId } })
  return court && court.isActive !== false ? court : null
}

function isConflict(bookings, entry) {
  return bookings.some((booking) => {
    if (booking.courtId !== entry.courtId) return false
    if (booking.status === 'CANCELLED') return false
    return new Date(entry.startsAt) < new Date(booking.endsAt) && new Date(entry.endsAt) > new Date(booking.startsAt)
  })
}

export async function POST(request) {
  const admin = await getAdminUser()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { ids, action } = bulkSchema.parse(await request.json())
    const prisma = getPrisma()

    if (!prisma) {
      const entries = memoryStore.waitlistEntries.filter((entry) => ids.includes(entry.id))
      const updated = []

      for (const entry of entries) {
        if (action === 'expire') {
          entry.status = 'EXPIRED'
          updated.push(entry)
          await recordAuditLog({
            actorId: admin.id,
            actorName: admin.name,
            actorRole: admin.role,
            action: 'EXPIRE',
            entityType: 'WAITLIST',
            entityId: entry.id,
            message: `تم إنهاء طلب الانتظار الخاص بـ ${entry.customerName}`,
            metadata: { courtId: entry.courtId },
          })
          continue
        }

        const court = memoryStore.courts.find((item) => item.id === entry.courtId) || null
        if (action === 'convert') {
          const bookings = memoryStore.bookings.filter((booking) => booking.courtId === entry.courtId)
          if (isConflict(bookings, entry)) continue

          const booking = {
            id: `booking-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
            courtId: entry.courtId,
            userId: entry.userId || null,
            customerName: entry.customerName,
            email: entry.email || null,
            phone: entry.phone,
            startsAt: entry.startsAt,
            endsAt: entry.endsAt,
            status: 'CONFIRMED',
            notes: entry.notes,
            amountCents: calculateAmountCents(court, entry.startsAt, entry.endsAt),
            seriesId: entry.seriesId || null,
            repeatPattern: entry.repeatPattern || 'NONE',
            repeatCount: entry.repeatCount || 1,
            occurrenceIndex: 0,
            court,
          }

          memoryStore.bookings.unshift(booking)
          entry.status = 'CONVERTED'
          entry.convertedBookingId = booking.id
          updated.push(entry)
          await recordAuditLog({
            actorId: admin.id,
            actorName: admin.name,
            actorRole: admin.role,
            action: 'CONVERT',
            entityType: 'WAITLIST',
            entityId: entry.id,
            message: `تم تحويل طلب الانتظار إلى حجز داخل ${court?.name || 'الملعب'}`,
            metadata: { bookingId: booking.id, courtId: entry.courtId },
          })
          continue
        }

        entry.status = 'NOTIFIED'
        entry.notifiedAt = new Date().toISOString()
        updated.push(entry)

        try {
          await notifyWaitlistEntries({ entries: [entry], court, reason: 'available', actor: admin })
        } catch (notifyError) {
          console.warn('waitlist notification failed', notifyError)
        }
      }

      return NextResponse.json({ waitlistEntries: updated, action })
    }

    const waitlistEntries = await prisma.waitlistEntry.findMany({
      where: { id: { in: ids } },
      include: { court: true, user: true },
    })

    if (!waitlistEntries.length) {
      return NextResponse.json({ error: 'No waitlist entries found' }, { status: 404 })
    }

    const updatedEntries = []

    if (action === 'expire') {
      await prisma.waitlistEntry.updateMany({
        where: { id: { in: ids } },
        data: { status: 'EXPIRED' },
      })
      updatedEntries.push(
        ...(await prisma.waitlistEntry.findMany({
          where: { id: { in: ids } },
          include: { court: true, user: true },
        }))
      )

      await Promise.all(
        updatedEntries.map((entry) =>
          recordAuditLog({
            actorId: admin.id,
            actorName: admin.name,
            actorRole: admin.role,
            action: 'EXPIRE',
            entityType: 'WAITLIST',
            entityId: entry.id,
            message: `تم إنهاء طلب الانتظار الخاص بـ ${entry.customerName}`,
            metadata: { courtId: entry.courtId },
          })
        )
      )
    }

    if (action === 'notify') {
      for (const entry of waitlistEntries) {
        const court = entry.court || (await getCourt(prisma, entry.courtId))
        try {
          await notifyWaitlistEntries({ entries: [entry], court, reason: 'available', actor: admin })
          await prisma.waitlistEntry.update({
            where: { id: entry.id },
            data: { status: 'NOTIFIED', notifiedAt: new Date() },
          })
          updatedEntries.push({ ...entry, status: 'NOTIFIED' })
        } catch (error) {
          console.warn('waitlist notification failed', error)
        }
      }
    }

    if (action === 'convert') {
      for (const entry of waitlistEntries) {
        const court = entry.court || (await getCourt(prisma, entry.courtId))
        const conflictingBookings = await prisma.booking.findMany({
          where: {
            courtId: entry.courtId,
            status: { not: 'CANCELLED' },
          },
        })

        if (isConflict(conflictingBookings, entry)) continue

        const booking = await prisma.booking.create({
          data: {
            courtId: entry.courtId,
            userId: entry.userId || null,
            customerName: entry.customerName,
            email: entry.email || null,
            phone: entry.phone,
            startsAt: entry.startsAt,
            endsAt: entry.endsAt,
            status: 'CONFIRMED',
            notes: entry.notes,
            amountCents: calculateAmountCents(court, entry.startsAt, entry.endsAt),
            seriesId: entry.seriesId || null,
            repeatPattern: entry.repeatPattern || 'NONE',
            repeatCount: entry.repeatCount || 1,
            occurrenceIndex: 0,
          },
        })

        await prisma.waitlistEntry.update({
          where: { id: entry.id },
          data: {
            status: 'CONVERTED',
            convertedBookingId: booking.id,
          },
        })
        updatedEntries.push({ ...entry, status: 'CONVERTED', convertedBookingId: booking.id })
        await recordAuditLog({
          actorId: admin.id,
          actorName: admin.name,
          actorRole: admin.role,
          action: 'CONVERT',
          entityType: 'WAITLIST',
          entityId: entry.id,
          message: `تم تحويل طلب الانتظار إلى حجز داخل ${court?.name || 'الملعب'}`,
          metadata: { bookingId: booking.id, courtId: entry.courtId },
        })
      }
    }

    return NextResponse.json({ waitlistEntries: updatedEntries, action })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid waitlist payload', issues: error.flatten() }, { status: 400 })
    }

    return NextResponse.json({ error: 'Unable to update waitlist' }, { status: 500 })
  }
}
