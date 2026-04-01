import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { getPrisma } from '@/lib/prisma'
import { memoryStore } from '@/lib/store'
import { SESSION_COOKIE, getUserFromSessionToken } from '@/lib/auth'

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

async function getCurrentUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null
  return getUserFromSessionToken(token)
}

export async function POST(request) {
  const user = await getCurrentUser()
  if (!user || !['TECHNICIAN', 'ADMIN'].includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { ids, action } = bulkSchema.parse(await request.json())
    const status = nextStatus(action)
    const prisma = getPrisma()

    if (!prisma) {
      const updatedJobs = []
      for (const job of memoryStore.maintenanceJobs) {
        if (!ids.includes(job.id)) continue

        if (user.role === 'TECHNICIAN' && job.technicianId !== user.id) continue

        job.status = status
        updatedJobs.push(job)
      }

      return NextResponse.json({ jobs: updatedJobs, action, status })
    }

    const jobsToUpdate = await prisma.maintenanceJob.findMany({
      where: { id: { in: ids } },
    })

    const authorizedIds = jobsToUpdate
      .filter((job) => user.role === 'ADMIN' || job.technicianId === user.id)
      .map((job) => job.id)

    if (!authorizedIds.length) {
      return NextResponse.json({ error: 'No authorized maintenance jobs found' }, { status: 403 })
    }

    await prisma.maintenanceJob.updateMany({
      where: { id: { in: authorizedIds } },
      data: { status },
    })

    const jobs = await prisma.maintenanceJob.findMany({
      where: { id: { in: authorizedIds } },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ jobs, action, status })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid bulk maintenance payload', issues: error.flatten() }, { status: 400 })
    }

    return NextResponse.json({ error: 'Unable to update maintenance jobs' }, { status: 500 })
  }
}
