import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin'
import { getPrisma } from '@/lib/prisma'
import { memoryStore } from '@/lib/store'

export const runtime = 'nodejs'

export async function GET(request) {
  const admin = await getAdminUser()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const status = url.searchParams.get('status') || ''
  const courtId = url.searchParams.get('courtId') || ''
  const from = url.searchParams.get('from') || ''
  const to = url.searchParams.get('to') || ''
  const fromDate = from ? new Date(from) : null
  const toDate = to ? new Date(to) : null

  const prisma = getPrisma()

  if (!prisma) {
    const waitlistEntries = memoryStore.waitlistEntries
      .filter((entry) => {
        if (status && entry.status !== status) return false
        if (courtId && entry.courtId !== courtId) return false
        const createdAt = new Date(entry.createdAt)
        if (fromDate && createdAt < fromDate) return false
        if (toDate && createdAt > toDate) return false
        return true
      })
      .map((entry) => ({
        ...entry,
        court: memoryStore.courts.find((court) => court.id === entry.courtId) || null,
      }))

    return NextResponse.json({ waitlistEntries })
  }

  const where = {}
  if (status) where.status = status
  if (courtId) where.courtId = courtId
  if (fromDate || toDate) {
    where.createdAt = {
      ...(fromDate ? { gte: fromDate } : {}),
      ...(toDate ? { lte: toDate } : {}),
    }
  }

  const waitlistEntries = await prisma.waitlistEntry.findMany({
    where,
    include: { court: true, user: true },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  return NextResponse.json({ waitlistEntries })
}
