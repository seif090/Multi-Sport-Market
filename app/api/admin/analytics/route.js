import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin'
import { getPrisma } from '@/lib/prisma'
import { memoryStore } from '@/lib/store'
import { calculateAnalytics } from '@/lib/analytics'

export const runtime = 'nodejs'

function parseDate(value) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function startOfDay(date) {
  const result = new Date(date)
  result.setHours(0, 0, 0, 0)
  return result
}

function endOfDayExclusive(date) {
  const result = new Date(date)
  result.setHours(0, 0, 0, 0)
  result.setDate(result.getDate() + 1)
  return result
}

function filterMemoryData(filters) {
  const courts = memoryStore.courts.filter((court) => {
    if (filters.courtId && court.id !== filters.courtId) return false
    if (filters.sport && court.sport !== filters.sport) return false
    return true
  })

  const courtIds = new Set(courts.map((court) => court.id))

  const bookings = memoryStore.bookings.filter((booking) => {
    if (!courtIds.has(booking.courtId)) return false
    if (filters.status && booking.status !== filters.status) return false
    if (filters.from && new Date(booking.startsAt) < filters.from) return false
    if (filters.to && new Date(booking.startsAt) >= filters.to) return false
    return true
  })

  const waitlistEntries = memoryStore.waitlistEntries.filter((entry) => {
    if (!courtIds.has(entry.courtId)) return false
    if (filters.waitlistStatus && entry.status !== filters.waitlistStatus) return false
    if (filters.from && new Date(entry.startsAt) < filters.from) return false
    if (filters.to && new Date(entry.startsAt) >= filters.to) return false
    return true
  })

  return { courts, bookings, waitlistEntries }
}

export async function GET(request) {
  const admin = await getAdminUser()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const filters = {
    courtId: url.searchParams.get('courtId') || '',
    sport: url.searchParams.get('sport') || '',
    status: url.searchParams.get('status') || '',
    waitlistStatus: url.searchParams.get('waitlistStatus') || '',
    from: parseDate(url.searchParams.get('from')),
    to: parseDate(url.searchParams.get('to')),
  }

  if (filters.from) filters.from = startOfDay(filters.from)
  if (filters.to) filters.to = endOfDayExclusive(filters.to)

  const prisma = getPrisma()

  if (!prisma) {
    const { courts, bookings, waitlistEntries } = filterMemoryData(filters)
    return NextResponse.json({
      ...calculateAnalytics({ courts, bookings, waitlistEntries }),
      filters: {
        courtId: filters.courtId,
        sport: filters.sport,
        status: filters.status,
        waitlistStatus: filters.waitlistStatus,
        from: filters.from?.toISOString() || '',
        to: filters.to?.toISOString() || '',
      },
      courts,
      bookings,
      waitlistEntries,
    })
  }

  try {
    const courtWhere = {}
    if (filters.courtId) courtWhere.id = filters.courtId
    if (filters.sport) courtWhere.sport = filters.sport

    const courts = await prisma.court.findMany({
      where: courtWhere,
      orderBy: { createdAt: 'desc' },
    })

    if ((filters.courtId || filters.sport) && courts.length === 0) {
      return NextResponse.json({
        ...calculateAnalytics({ courts: [], bookings: [], waitlistEntries: [] }),
        filters: {
          courtId: filters.courtId,
          sport: filters.sport,
          status: filters.status,
          waitlistStatus: filters.waitlistStatus,
          from: filters.from?.toISOString() || '',
          to: filters.to?.toISOString() || '',
        },
        courts: [],
        bookings: [],
        waitlistEntries: [],
      })
    }

    const courtIds = courts.map((court) => court.id)
    const bookingWhere = {}
    const waitlistWhere = {}

    if (courtIds.length) {
      bookingWhere.courtId = { in: courtIds }
      waitlistWhere.courtId = { in: courtIds }
    }

    if (filters.status) {
      bookingWhere.status = filters.status
    }

    if (filters.waitlistStatus) {
      waitlistWhere.status = filters.waitlistStatus
    }

    if (filters.from || filters.to) {
      bookingWhere.startsAt = {}
      waitlistWhere.startsAt = {}

      if (filters.from) {
        bookingWhere.startsAt.gte = filters.from
        waitlistWhere.startsAt.gte = filters.from
      }

      if (filters.to) {
        bookingWhere.startsAt.lt = filters.to
        waitlistWhere.startsAt.lt = filters.to
      }
    }

    const [bookings, waitlistEntries] = await Promise.all([
      prisma.booking.findMany({
        where: bookingWhere,
        include: { court: true },
        orderBy: { startsAt: 'desc' },
      }),
      prisma.waitlistEntry.findMany({
        where: waitlistWhere,
        include: { court: true },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    return NextResponse.json({
      ...calculateAnalytics({ courts, bookings, waitlistEntries }),
      filters: {
        courtId: filters.courtId,
        sport: filters.sport,
        status: filters.status,
        waitlistStatus: filters.waitlistStatus,
        from: filters.from?.toISOString() || '',
        to: filters.to?.toISOString() || '',
      },
      courts,
      bookings,
      waitlistEntries,
    })
  } catch {
    const { courts, bookings, waitlistEntries } = filterMemoryData(filters)
    return NextResponse.json({
      ...calculateAnalytics({ courts, bookings, waitlistEntries }),
      filters: {
        courtId: filters.courtId,
        sport: filters.sport,
        status: filters.status,
        waitlistStatus: filters.waitlistStatus,
        from: filters.from?.toISOString() || '',
        to: filters.to?.toISOString() || '',
      },
      courts,
      bookings,
      waitlistEntries,
    })
  }
}
