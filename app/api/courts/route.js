import { NextResponse } from 'next/server'
import { getPrisma } from '@/lib/prisma'
import { memoryStore } from '@/lib/store'

export const runtime = 'nodejs'

export async function GET() {
  const prisma = getPrisma()

  if (!prisma) {
    return NextResponse.json({ courts: memoryStore.courts.filter((court) => court.isActive !== false), source: 'mock' })
  }

  try {
    const courts = await prisma.court.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ courts, source: 'database' })
  } catch {
    return NextResponse.json({ courts: memoryStore.courts.filter((court) => court.isActive !== false), source: 'mock' })
  }
}
