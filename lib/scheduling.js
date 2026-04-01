const PRICE_TIERS_CENTS = {
  low: 12000,
  mid: 18000,
  high: 26000,
}

export function overlaps(startA, endA, startB, endB) {
  return startA < endB && endA > startB
}

export function formatTime(date) {
  return new Intl.DateTimeFormat('ar-EG', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function formatDayLabel(date) {
  return new Intl.DateTimeFormat('ar-EG', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

function roundToNextHalfHour(date) {
  const result = new Date(date)
  const minutes = result.getMinutes()
  const remainder = minutes % 30
  if (remainder !== 0) {
    result.setMinutes(minutes + (30 - remainder))
  }
  result.setSeconds(0, 0)
  return result
}

export function buildSlots(bookings, baseDate = new Date(), slotCount = 6, slotDurationMinutes = 90) {
  const slots = []
  const current = roundToNextHalfHour(baseDate)

  for (let index = 0; index < slotCount; index += 1) {
    const start = new Date(current.getTime() + index * slotDurationMinutes * 60 * 1000)
    const end = new Date(start.getTime() + slotDurationMinutes * 60 * 1000)
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

export function buildBusinessSlots(bookings, baseDate = new Date(), startHour = 8, endHour = 23, slotDurationMinutes = 90) {
  const slots = []
  const day = new Date(baseDate)
  day.setHours(startHour, 0, 0, 0)
  const endBoundary = new Date(baseDate)
  endBoundary.setHours(endHour, 0, 0, 0)

  for (let cursor = new Date(day); new Date(cursor.getTime() + slotDurationMinutes * 60 * 1000) <= endBoundary; cursor = new Date(cursor.getTime() + slotDurationMinutes * 60 * 1000)) {
    const start = new Date(cursor)
    const end = new Date(start.getTime() + slotDurationMinutes * 60 * 1000)
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

export function buildCalendar(bookings, baseDate = new Date(), days = 7) {
  const calendar = []

  for (let index = 0; index < days; index += 1) {
    const day = new Date(baseDate)
    day.setDate(day.getDate() + index)
    day.setHours(0, 0, 0, 0)

    calendar.push({
      date: day.toISOString(),
      label: formatDayLabel(day),
      slots: buildSlots(bookings, day),
    })
  }

  return calendar
}

export function buildAvailabilitySummary(bookings) {
  const now = new Date()
  const sortedBookings = [...bookings].sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt))
  const currentBooking = sortedBookings.find((booking) => new Date(booking.startsAt) <= now && new Date(booking.endsAt) > now)
  if (currentBooking) {
    return {
      label: 'حجز جاري الآن',
      tone: 'busy',
      nextLabel: formatTime(new Date(currentBooking.endsAt)),
    }
  }

  const nextBooking = sortedBookings.find((booking) => new Date(booking.startsAt) > now)
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

export function expandRecurrence({ startsAt, endsAt, repeatPattern = 'NONE', repeatCount = 1 }) {
  const start = new Date(startsAt)
  const end = new Date(endsAt)
  const safeCount = Math.max(1, Math.min(Number(repeatCount) || 1, 12))
  const normalizedPattern = String(repeatPattern || 'NONE').toUpperCase()
  const stepDays = normalizedPattern === 'DAILY' ? 1 : normalizedPattern === 'WEEKLY' ? 7 : 0
  const occurrences = []
  const seriesId = `series-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`

  for (let index = 0; index < safeCount; index += 1) {
    const occurrenceStart = new Date(start)
    const occurrenceEnd = new Date(end)

    if (stepDays > 0) {
      occurrenceStart.setDate(occurrenceStart.getDate() + index * stepDays)
      occurrenceEnd.setDate(occurrenceEnd.getDate() + index * stepDays)
    }

    occurrences.push({
      occurrenceIndex: index,
      seriesId,
      repeatPattern: normalizedPattern,
      repeatCount: safeCount,
      startsAt: occurrenceStart,
      endsAt: occurrenceEnd,
    })
  }

  return occurrences
}

export function calculateAmountCents(court, startsAt, endsAt) {
  const durationMinutes = Math.max(30, Math.round((new Date(endsAt) - new Date(startsAt)) / 60000))
  const baseAmount = PRICE_TIERS_CENTS[court?.price] ?? PRICE_TIERS_CENTS.mid
  const amount = Math.round((baseAmount * durationMinutes) / 90)
  return amount
}

export function getPriceTierLabel(price) {
  switch (price) {
    case 'low':
      return 'منخفض'
    case 'high':
      return 'مرتفع'
    default:
      return 'متوسط'
  }
}
