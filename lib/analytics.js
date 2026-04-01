function startOfDay(date) {
  const result = new Date(date)
  result.setHours(0, 0, 0, 0)
  return result
}

function formatDayKey(date) {
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

function round(value, digits = 1) {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

function formatCurrency(cents) {
  return new Intl.NumberFormat('ar-EG', {
    style: 'currency',
    currency: 'EGP',
    maximumFractionDigits: 0,
  }).format((cents || 0) / 100)
}

export function calculateAnalytics({ courts = [], bookings = [], waitlistEntries = [] }) {
  const activeCourts = courts.filter((court) => court.isActive !== false)
  const activeBookings = bookings.filter((booking) => booking.status !== 'CANCELLED')
  const confirmedBookings = bookings.filter((booking) => booking.status === 'CONFIRMED')
  const recurringBookings = bookings.filter((booking) => Number(booking.repeatCount || 1) > 1 || Boolean(booking.seriesId))
  const convertedWaitlist = waitlistEntries.filter((entry) => entry.status === 'CONVERTED')

  const revenueCents = activeBookings.reduce((sum, booking) => sum + Number(booking.amountCents || 0), 0)
  const confirmedRevenueCents = confirmedBookings.reduce((sum, booking) => sum + Number(booking.amountCents || 0), 0)
  const bookedMinutes = activeBookings.reduce((sum, booking) => {
    return sum + Math.max(0, (new Date(booking.endsAt) - new Date(booking.startsAt)) / 60000)
  }, 0)

  const utilizationBaseMinutes = Math.max(1, activeCourts.length * 30 * 18 * 60)
  const utilizationPercent = round((bookedMinutes / utilizationBaseMinutes) * 100, 1)
  const bookingConversionPercent = round((confirmedBookings.length / Math.max(1, bookings.length)) * 100, 1)
  const waitlistConversionPercent = round((convertedWaitlist.length / Math.max(1, waitlistEntries.length)) * 100, 1)
  const recurringSharePercent = round((recurringBookings.length / Math.max(1, bookings.length)) * 100, 1)

  const lastSevenDays = []
  for (let index = 6; index >= 0; index -= 1) {
    const day = startOfDay(new Date(Date.now() - index * 24 * 60 * 60 * 1000))
    const key = formatDayKey(day)
    const dayRevenue = activeBookings
      .filter((booking) => formatDayKey(new Date(booking.startsAt)) === key)
      .reduce((sum, booking) => sum + Number(booking.amountCents || 0), 0)
    lastSevenDays.push({
      label: new Intl.DateTimeFormat('ar-EG', { weekday: 'short' }).format(day),
      value: dayRevenue,
      formatted: formatCurrency(dayRevenue),
    })
  }

  const topCourts = activeBookings.reduce((acc, booking) => {
    const key = booking.court?.name || booking.courtId
    const current = acc.get(key) || { name: key, count: 0, revenueCents: 0 }
    current.count += 1
    current.revenueCents += Number(booking.amountCents || 0)
    acc.set(key, current)
    return acc
  }, new Map())

  const rankedCourts = [...topCourts.values()]
    .sort((a, b) => b.revenueCents - a.revenueCents)
    .slice(0, 5)
    .map((item) => ({
      ...item,
      revenue: formatCurrency(item.revenueCents),
    }))

  return {
    revenueCents,
    revenue: formatCurrency(revenueCents),
    confirmedRevenue: formatCurrency(confirmedRevenueCents),
    utilizationPercent,
    bookingConversionPercent,
    waitlistConversionPercent,
    recurringSharePercent,
    totalBookings: bookings.length,
    confirmedBookings: confirmedBookings.length,
    waitlistCount: waitlistEntries.length,
    recurringCount: recurringBookings.length,
    activeCourts: activeCourts.length,
    dailyRevenue: lastSevenDays,
    topCourts: rankedCourts,
  }
}
