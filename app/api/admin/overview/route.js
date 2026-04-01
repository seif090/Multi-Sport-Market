import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { SESSION_COOKIE, getUserFromSessionToken } from '@/lib/auth'
import { getPrisma } from '@/lib/prisma'
import { memoryStore } from '@/lib/store'

export const runtime = 'nodejs'

async function getAdminUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null
  const user = await getUserFromSessionToken(token)
  return user && user.role === 'ADMIN' ? user : null
}

export async function GET() {
  const user = await getAdminUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const prisma = getPrisma()

  if (!prisma) {
    return NextResponse.json({
      summary: {
        users: memoryStore.users.length,
        courts: memoryStore.courts.length,
        bookings: memoryStore.bookings.length,
        jobs: memoryStore.maintenanceJobs.length,
      },
      users: memoryStore.users,
      courts: memoryStore.courts,
      bookings: memoryStore.bookings,
      jobs: memoryStore.maintenanceJobs,
      currentUser: user,
    })
  }

  const [users, courts, bookings, jobs, summary] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 20 }),
    prisma.court.findMany({ orderBy: { createdAt: 'desc' }, take: 20 }),
    prisma.booking.findMany({ include: { court: true }, orderBy: { createdAt: 'desc' }, take: 20 }),
    prisma.maintenanceJob.findMany({ orderBy: { createdAt: 'desc' }, take: 20 }),
    Promise.all([
      prisma.user.count(),
      prisma.court.count(),
      prisma.booking.count(),
      prisma.maintenanceJob.count(),
    ]).then(([usersCount, courtsCount, bookingsCount, jobsCount]) => ({
      users: usersCount,
      courts: courtsCount,
      bookings: bookingsCount,
      jobs: jobsCount,
    })),
  ])

  return NextResponse.json({
    summary,
    users,
    courts,
    bookings,
    jobs,
    currentUser: user,
  })
}
