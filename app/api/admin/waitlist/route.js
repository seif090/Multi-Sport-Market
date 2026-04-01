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

  const prisma = getPrisma()

  if (!prisma) {
    const waitlistEntries = memoryStore.waitlistEntries
      .filter((entry) => {
        if (status && entry.status !== status) return false
        if (courtId && entry.courtId !== courtId) return false
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

  const waitlistEntries = await prisma.waitlistEntry.findMany({
    where,
    include: { court: true, user: true },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  return NextResponse.json({ waitlistEntries })
}
