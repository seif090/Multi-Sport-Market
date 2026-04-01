import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAdminUser } from '@/lib/admin'
import { recordAuditLog } from '@/lib/audit'
import { getPrisma } from '@/lib/prisma'
import { memoryStore } from '@/lib/store'

export const runtime = 'nodejs'

const bulkSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
  action: z.enum(['accept', 'complete', 'cancel']),
})

function nextStatus(action) {
  switch (action) {
    case 'accept':
      return 'ACCEPTED'
    case 'complete':
      return 'COMPLETED'
    default:
      return 'CANCELLED'
  }
}

export async function POST(request) {
  const admin = await getAdminUser()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { ids, action } = bulkSchema.parse(await request.json())
    const status = nextStatus(action)
    const prisma = getPrisma()

    if (!prisma) {
      const updatedJobs = []
      memoryStore.maintenanceJobs.forEach((job) => {
        if (ids.includes(job.id)) {
          job.status = status
          updatedJobs.push(job)
        }
      })

      for (const job of updatedJobs) {
        await recordAuditLog({
          actorId: admin.id,
          actorName: admin.name,
          actorRole: admin.role,
          action: 'UPDATE',
          entityType: 'MAINTENANCE',
          entityId: job.id,
          message:
            status === 'ACCEPTED'
              ? `تم قبول طلب الصيانة ${job.title}`
              : status === 'COMPLETED'
                ? `تم إكمال طلب الصيانة ${job.title}`
                : `تم إلغاء طلب الصيانة ${job.title}`,
          metadata: { status },
        })
      }

      return NextResponse.json({ jobs: updatedJobs, action, status })
    }

    const jobs = await prisma.maintenanceJob.updateMany({
      where: { id: { in: ids } },
      data: { status },
    })

    const updatedJobs = await prisma.maintenanceJob.findMany({
      where: { id: { in: ids } },
    })

    for (const job of updatedJobs) {
      await recordAuditLog({
        actorId: admin.id,
        actorName: admin.name,
        actorRole: admin.role,
        action: 'UPDATE',
        entityType: 'MAINTENANCE',
        entityId: job.id,
        message:
          status === 'ACCEPTED'
            ? `تم قبول طلب الصيانة ${job.title}`
            : status === 'COMPLETED'
              ? `تم إكمال طلب الصيانة ${job.title}`
              : `تم إلغاء طلب الصيانة ${job.title}`,
        metadata: { status },
      })
    }

    return NextResponse.json({ jobs: updatedJobs, action, status })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid bulk maintenance payload', issues: error.flatten() }, { status: 400 })
    }

    return NextResponse.json({ error: 'Unable to update maintenance jobs' }, { status: 500 })
  }
}
