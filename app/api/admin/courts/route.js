import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAdminUser } from '@/lib/admin'
import { recordAuditLog } from '@/lib/audit'
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

export async function POST(request) {
  const admin = await getAdminUser()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const payload = courtSchema.parse(await request.json())
    const prisma = getPrisma()

    if (!prisma) {
      const court = {
        id: `court-${randomUUID()}`,
        ...payload,
      }
      memoryStore.courts.unshift(court)
      await recordAuditLog({
        actorId: admin.id,
        actorName: admin.name,
        actorRole: admin.role,
        action: 'CREATE',
        entityType: 'COURT',
        entityId: court.id,
        message: `تم إنشاء ملعب ${court.name}`,
        metadata: payload,
      })
      return NextResponse.json({ court }, { status: 201 })
    }

    const court = await prisma.court.create({
      data: payload,
    })

    await recordAuditLog({
      actorId: admin.id,
      actorName: admin.name,
      actorRole: admin.role,
      action: 'CREATE',
      entityType: 'COURT',
      entityId: court.id,
      message: `تم إنشاء ملعب ${court.name}`,
      metadata: payload,
    })

    return NextResponse.json({ court }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid court payload', issues: error.flatten() }, { status: 400 })
    }

    return NextResponse.json({ error: 'Unable to create court' }, { status: 500 })
  }
}
