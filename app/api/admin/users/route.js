import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAdminUser } from '@/lib/admin'
import { buildAuditSnapshot, recordAuditLog } from '@/lib/audit'
import { getPrisma } from '@/lib/prisma'
import { memoryStore } from '@/lib/store'

export const runtime = 'nodejs'

const userSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(8),
  role: z.enum(['PLAYER', 'VENDOR', 'TECHNICIAN', 'ADMIN']),
  isActive: z.coerce.boolean().default(true),
})

export async function POST(request) {
  const admin = await getAdminUser()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const payload = userSchema.parse(await request.json())
    const prisma = getPrisma()

    if (!prisma) {
      const user = {
        id: `user-${randomUUID()}`,
        ...payload,
      }
      memoryStore.users.unshift(user)
      await recordAuditLog({
        actorId: admin.id,
        actorName: admin.name,
        actorRole: admin.role,
        action: 'CREATE',
        entityType: 'USER',
        entityId: user.id,
        message: `تم إنشاء مستخدم ${user.name}`,
        metadata: {
          after: buildAuditSnapshot('USER', user),
        },
      })
      return NextResponse.json({ user }, { status: 201 })
    }

    const user = await prisma.user.create({
      data: payload,
    })

    await recordAuditLog({
      actorId: admin.id,
      actorName: admin.name,
      actorRole: admin.role,
      action: 'CREATE',
      entityType: 'USER',
      entityId: user.id,
      message: `تم إنشاء مستخدم ${user.name}`,
      metadata: {
        after: buildAuditSnapshot('USER', user),
      },
    })

    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid user payload', issues: error.flatten() }, { status: 400 })
    }

    return NextResponse.json({ error: 'Unable to create user' }, { status: 500 })
  }
}
