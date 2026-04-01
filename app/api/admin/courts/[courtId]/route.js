import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAdminUser } from '@/lib/admin'
import { getPrisma } from '@/lib/prisma'
import { memoryStore } from '@/lib/store'

export const runtime = 'nodejs'

const courtSchema = z.object({
  name: z.string().min(2),
  area: z.string().min(2),
  areaLabel: z.string().min(2),
  sport: z.string().min(2),
  sportLabel: z.string().min(2),
  price: z.string().min(2),
  priceLabel: z.string().min(2),
  badge: z.string().min(1),
  description: z.string().min(5),
  isActive: z.coerce.boolean(),
})

export async function PUT(request, { params }) {
  const admin = await getAdminUser()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { courtId } = await params

  try {
    const payload = courtSchema.parse(await request.json())
    const prisma = getPrisma()

    if (!prisma) {
      const court = memoryStore.courts.find((item) => item.id === courtId)
      if (!court) {
        return NextResponse.json({ error: 'Court not found' }, { status: 404 })
      }

      Object.assign(court, payload)
      return NextResponse.json({ court })
    }

    const court = await prisma.court.update({
      where: { id: courtId },
      data: payload,
    })

    return NextResponse.json({ court })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid court payload', issues: error.flatten() }, { status: 400 })
    }

    return NextResponse.json({ error: 'Unable to update court' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  const admin = await getAdminUser()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { courtId } = await params
  const prisma = getPrisma()

  try {
    if (!prisma) {
      const court = memoryStore.courts.find((item) => item.id === courtId)
      if (!court) {
        return NextResponse.json({ error: 'Court not found' }, { status: 404 })
      }

      court.isActive = false
      return NextResponse.json({ court })
    }

    const existingCourt = await prisma.court.findUnique({
      where: { id: courtId },
    })

    if (!existingCourt) {
      return NextResponse.json({ error: 'Court not found' }, { status: 404 })
    }

    const updatedCourt = await prisma.court.update({
      where: { id: courtId },
      data: { isActive: false },
    })

    return NextResponse.json({ court: updatedCourt })
  } catch (error) {
    return NextResponse.json({ error: 'Unable to update court status' }, { status: 500 })
  }
}
