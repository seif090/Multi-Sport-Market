import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAdminUser } from '@/lib/admin'
import { getPrisma } from '@/lib/prisma'
import { memoryStore } from '@/lib/store'

export const runtime = 'nodejs'

const bulkSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
  action: z.enum(['confirm', 'cancel']),
})

function nextStatus(action) {
  return action === 'confirm' ? 'CONFIRMED' : 'CANCELLED'
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
      const updatedBookings = []
      memoryStore.bookings.forEach((booking) => {
        if (ids.includes(booking.id)) {
          booking.status = status
          updatedBookings.push(booking)
        }
      })
      return NextResponse.json({ bookings: updatedBookings, action, status })
    }

    const bookings = await prisma.booking.updateMany({
      where: { id: { in: ids } },
      data: { status },
    })

    return NextResponse.json({ bookings, action, status })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid bulk booking payload', issues: error.flatten() }, { status: 400 })
    }

    return NextResponse.json({ error: 'Unable to update bookings' }, { status: 500 })
  }
}
