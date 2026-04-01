import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin'
import { getPrisma } from '@/lib/prisma'
import { memoryStore } from '@/lib/store'
import { calculateAnalytics } from '@/lib/analytics'

export const runtime = 'nodejs'

export async function GET() {
  const admin = await getAdminUser()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const prisma = getPrisma()

  if (!prisma) {
    return NextResponse.json(
      calculateAnalytics({
        courts: memoryStore.courts,
        bookings: memoryStore.bookings,
        waitlistEntries: memoryStore.waitlistEntries,
      })
    )
  }

  try {
    const [courts, bookings, waitlistEntries] = await Promise.all([
      prisma.court.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.booking.findMany({ include: { court: true }, orderBy: { startsAt: 'desc' }, take: 100 }),
      prisma.waitlistEntry.findMany({ include: { court: true }, orderBy: { createdAt: 'desc' }, take: 100 }),
    ])

    return NextResponse.json(calculateAnalytics({ courts, bookings, waitlistEntries }))
  } catch {
    return NextResponse.json(
      calculateAnalytics({
        courts: memoryStore.courts,
        bookings: memoryStore.bookings,
        waitlistEntries: memoryStore.waitlistEntries,
      })
    )
  }
}
