import { PrismaClient, BookingStatus, MaintenanceStatus, UserRole } from '@prisma/client'
import { auditSeed, bookingsSeed, courtsSeed, maintenanceSeed, usersSeed, waitlistSeed } from '../lib/seed.js'
import { calculateAmountCents } from '../lib/scheduling.js'

const prisma = new PrismaClient()

async function main() {
  if (!process.env.DATABASE_URL) {
    console.log('DATABASE_URL is missing, skipping seed.')
    return
  }

  await prisma.booking.deleteMany()
  await prisma.maintenanceJob.deleteMany()
  await prisma.court.deleteMany()
  await prisma.user.deleteMany()

  const createdUsers = {}

  for (const user of usersSeed) {
    createdUsers[user.id] = await prisma.user.create({
      data: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: UserRole[user.role],
        isActive: user.isActive ?? true,
      },
    })
  }

  for (const court of courtsSeed) {
    await prisma.court.create({
      data: {
        ...court,
        vendorId: createdUsers['user-vendor-1']?.id,
      },
    })
  }

  for (const booking of bookingsSeed) {
    const court = courtsSeed.find((item) => item.id === booking.courtId)
    await prisma.booking.create({
      data: {
        id: booking.id,
        courtId: booking.courtId,
        userId: booking.userId || null,
        customerName: booking.customerName,
        email: booking.email || null,
        phone: booking.phone,
        startsAt: new Date(booking.startsAt),
        endsAt: new Date(booking.endsAt),
        status: BookingStatus[booking.status],
        notes: booking.notes,
        amountCents: booking.amountCents ?? calculateAmountCents(court, booking.startsAt, booking.endsAt),
        seriesId: booking.seriesId || null,
        repeatPattern: booking.repeatPattern || 'NONE',
        repeatCount: booking.repeatCount || 1,
        occurrenceIndex: booking.occurrenceIndex || 0,
      },
    })
  }

  for (const job of maintenanceSeed) {
    await prisma.maintenanceJob.create({
      data: {
        id: job.id,
        title: job.title,
        category: job.category,
        vendorName: job.vendorName,
        customerName: job.customerName,
        phone: job.phone,
        status: MaintenanceStatus[job.status],
        notes: job.notes,
        vendorId: createdUsers['user-vendor-1']?.id,
        technicianId: createdUsers['user-tech-1']?.id,
      },
    })
  }

  for (const entry of waitlistSeed) {
    await prisma.waitlistEntry.create({
      data: {
        id: entry.id,
        courtId: entry.courtId,
        userId: entry.userId || null,
        customerName: entry.customerName,
        email: entry.email || null,
        phone: entry.phone,
        startsAt: new Date(entry.startsAt),
        endsAt: new Date(entry.endsAt),
        status: entry.status,
        notes: entry.notes,
        repeatPattern: entry.repeatPattern || null,
        repeatCount: entry.repeatCount || 1,
        seriesId: entry.seriesId || null,
        notifiedAt: entry.notifiedAt ? new Date(entry.notifiedAt) : null,
      },
    })
  }

  for (const log of auditSeed) {
    await prisma.auditLog.create({
      data: {
        id: log.id,
        actorId: log.actorId || null,
        actorName: log.actorName || null,
        actorRole: log.actorRole || null,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId || null,
        message: log.message,
        metadata: log.metadata || null,
      },
    })
  }

  console.log(
    `Seeded ${courtsSeed.length} courts, ${bookingsSeed.length} bookings, ${waitlistSeed.length} waitlist entries, ${maintenanceSeed.length} maintenance jobs, and ${auditSeed.length} audit logs.`
  )
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
