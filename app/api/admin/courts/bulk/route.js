import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAdminUser } from '@/lib/admin'
import { getPrisma } from '@/lib/prisma'
import { memoryStore } from '@/lib/store'

export const runtime = 'nodejs'

const bulkSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
  action: z.enum(['activate', 'deactivate']),
})

export async function POST(request) {
  const admin = await getAdminUser()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { ids, action } = bulkSchema.parse(await request.json())
    const isActive = action === 'activate'
    const prisma = getPrisma()

    if (!prisma) {
      const updatedCourts = []
      memoryStore.courts.forEach((court) => {
        if (ids.includes(court.id)) {
          court.isActive = isActive
          updatedCourts.push(court)
        }
      })

      return NextResponse.json({ courts: updatedCourts, action })
    }

    const courts = await prisma.court.updateMany({
      where: { id: { in: ids } },
      data: { isActive },
    })

    return NextResponse.json({ courts, action })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid bulk court payload', issues: error.flatten() }, { status: 400 })
    }

    return NextResponse.json({ error: 'Unable to update courts' }, { status: 500 })
  }
}
