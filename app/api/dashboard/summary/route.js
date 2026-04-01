import { NextResponse } from 'next/server'
import { getPrisma } from '@/lib/prisma'
import { memoryStore } from '@/lib/store'

export const runtime = 'nodejs'

export async function GET() {
  const prisma = getPrisma()

  if (!prisma) {
    return NextResponse.json({
      courts: memoryStore.courts.length,
      bookings: memoryStore.bookings.length,
      jobs: memoryStore.maintenanceJobs.length,
    })
  }

  try {
    const [courts, bookings, jobs] = await Promise.all([
      prisma.court.count({ where: { isActive: true } }),
      prisma.booking.count(),
      prisma.maintenanceJob.count(),
    ])

    return NextResponse.json({ courts, bookings, jobs })
  } catch {
    return NextResponse.json({
      courts: memoryStore.courts.length,
      bookings: memoryStore.bookings.length,
      jobs: memoryStore.maintenanceJobs.length,
    })
  }
}
