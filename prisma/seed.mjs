import { PrismaClient, BookingStatus, MaintenanceStatus, UserRole } from '@prisma/client'
import { bookingsSeed, courtsSeed, maintenanceSeed, usersSeed } from '../lib/seed.js'

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
    await prisma.booking.create({
      data: {
        id: booking.id,
        courtId: booking.courtId,
        userId: booking.userId || null,
        customerName: booking.customerName,
        phone: booking.phone,
        startsAt: new Date(booking.startsAt),
        endsAt: new Date(booking.endsAt),
        status: BookingStatus[booking.status],
        notes: booking.notes,
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

  console.log(`Seeded ${courtsSeed.length} courts, ${bookingsSeed.length} bookings, and ${maintenanceSeed.length} maintenance jobs.`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
