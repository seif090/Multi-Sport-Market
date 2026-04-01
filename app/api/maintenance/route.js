import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { getPrisma } from '@/lib/prisma'
import { memoryStore } from '@/lib/store'
import { SESSION_COOKIE, getUserFromSessionToken } from '@/lib/auth'

export const runtime = 'nodejs'

const maintenanceSchema = z.object({
  title: z.string().min(3),
  category: z.string().min(2),
  vendorName: z.string().min(2),
  customerName: z.string().min(2),
  phone: z.string().min(8),
  notes: z.string().optional(),
})

export async function GET() {
  const prisma = getPrisma()

  if (!prisma) {
    return NextResponse.json({ jobs: memoryStore.maintenanceJobs })
  }

  try {
    const jobs = await prisma.maintenanceJob.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    return NextResponse.json({ jobs })
  } catch {
    return NextResponse.json({ jobs: memoryStore.maintenanceJobs })
  }
}

export async function POST(request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_COOKIE)?.value
    const user = token ? await getUserFromSessionToken(token) : null

    if (!user || !['VENDOR', 'ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = maintenanceSchema.parse(await request.json())
    const prisma = getPrisma()

    if (!prisma) {
      const job = { id: `job-${Date.now()}`, status: 'NEW', vendorId: user.id, technicianId: null, ...body }
      memoryStore.maintenanceJobs.unshift(job)
      return NextResponse.json({ job }, { status: 201 })
    }

    const job = await prisma.maintenanceJob.create({
      data: {
        ...body,
        vendorId: user.id,
      },
    })

    return NextResponse.json({ job }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid maintenance payload', issues: error.flatten() }, { status: 400 })
    }

    return NextResponse.json({ error: 'Unable to create maintenance job' }, { status: 500 })
  }
}
