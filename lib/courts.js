import { getPrisma } from './prisma'
import { memoryStore } from './store'
import { buildAvailabilitySummary, buildCalendar, buildSlots, overlaps } from './scheduling'

export async function getCourtById(courtId) {
  const prisma = getPrisma()

  if (!prisma) {
    return memoryStore.courts.find((court) => court.id === courtId && court.isActive !== false) || null
  }

  return prisma.court.findUnique({
    where: { id: courtId },
    include: { vendor: true },
  }).then((court) => (court && court.isActive !== false ? court : null))
}

export async function getCourtBookings(courtId) {
  const prisma = getPrisma()

  if (!prisma) {
    return memoryStore.bookings.filter((booking) => booking.courtId === courtId && booking.status !== 'CANCELLED')
  }

  return prisma.booking.findMany({
    where: {
      courtId,
      status: { not: 'CANCELLED' },
    },
    orderBy: { startsAt: 'asc' },
    take: 12,
  })
}

export async function getCourtWaitlist(courtId) {
  const prisma = getPrisma()

  if (!prisma) {
    return memoryStore.waitlistEntries.filter((entry) => entry.courtId === courtId).slice(0, 10)
  }

  return prisma.waitlistEntry.findMany({
    where: { courtId },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })
}

export async function getCourtAvailability(courtId) {
  const [court, bookings, waitlistEntries] = await Promise.all([
    getCourtById(courtId),
    getCourtBookings(courtId),
    getCourtWaitlist(courtId),
  ])

  if (!court) {
    return null
  }

  return {
    court,
    bookings,
    waitlistEntries,
    calendar: buildCalendar(bookings),
    slots: buildSlots(bookings),
    generatedAt: new Date().toISOString(),
  }
}

export async function getAllCourts() {
  const prisma = getPrisma()

  if (!prisma) {
    return memoryStore.courts.filter((court) => court.isActive !== false)
  }

  try {
    return await prisma.court.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      include: { vendor: true },
    })
  } catch {
    return memoryStore.courts.filter((court) => court.isActive !== false)
  }
}

export async function getCourtsWithAvailability() {
  const courts = await getAllCourts()

  return Promise.all(
    courts.map(async (court) => {
      const bookings = await getCourtBookings(court.id)
      const availability = buildAvailabilitySummary(bookings)

      return {
        ...court,
        availableNow: availability.tone === 'available',
        availabilityLabel: availability.tone === 'available' ? 'متاح الآن' : 'محجوز جزئيًا',
      }
    })
  )
}

export function getAvailabilitySummary(bookings) {
  return buildAvailabilitySummary(bookings)
}

export function overlapsBookings(startA, endA, startB, endB) {
  return overlaps(startA, endA, startB, endB)
}
