import { getPrisma } from './prisma'
import { memoryStore } from './store'

function overlaps(startA, endA, startB, endB) {
  return startA < endB && endA > startB
}

function startOfDay(date) {
  const result = new Date(date)
  result.setHours(0, 0, 0, 0)
  return result
}

function formatTime(date) {
  return new Intl.DateTimeFormat('ar-EG', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function buildSlots(bookings, baseDate = new Date()) {
  const slots = []
  const current = new Date(baseDate)
  current.setMinutes(current.getMinutes() % 30 === 0 ? current.getMinutes() : current.getMinutes() + (30 - (current.getMinutes() % 30)), 0, 0)

  for (let index = 0; index < 6; index += 1) {
    const start = new Date(current.getTime() + index * 90 * 60 * 1000)
    const end = new Date(start.getTime() + 90 * 60 * 1000)
    const hasConflict = bookings.some((booking) => overlaps(start, end, new Date(booking.startsAt), new Date(booking.endsAt)))

    slots.push({
      start: start.toISOString(),
      end: end.toISOString(),
      label: `${formatTime(start)} - ${formatTime(end)}`,
      available: !hasConflict,
    })
  }

  return slots
}

export async function getCourtById(courtId) {
  const prisma = getPrisma()

  if (!prisma) {
    return memoryStore.courts.find((court) => court.id === courtId) || null
  }

  return prisma.court.findUnique({
    where: { id: courtId },
    include: { vendor: true },
  })
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

export async function getCourtAvailability(courtId) {
  const [court, bookings] = await Promise.all([getCourtById(courtId), getCourtBookings(courtId)])

  if (!court) {
    return null
  }

  return {
    court,
    bookings,
    slots: buildSlots(bookings),
    generatedAt: new Date().toISOString(),
  }
}

export function getAvailabilitySummary(bookings) {
  const now = new Date()
  const currentBooking = bookings.find((booking) => overlaps(new Date(booking.startsAt), new Date(booking.endsAt), now, now))
  if (currentBooking) {
    return {
      label: 'حجز جارٍ الآن',
      tone: 'busy',
      nextLabel: formatTime(new Date(currentBooking.endsAt)),
    }
  }

  const nextBooking = bookings.find((booking) => new Date(booking.startsAt) > now)
  if (nextBooking) {
    return {
      label: 'الملعب متاح الآن',
      tone: 'available',
      nextLabel: `حجز قادم ${formatTime(new Date(nextBooking.startsAt))}`,
    }
  }

  return {
    label: 'متاح للحجز',
    tone: 'available',
    nextLabel: 'مفيش حجوزات قريبة',
  }
}
