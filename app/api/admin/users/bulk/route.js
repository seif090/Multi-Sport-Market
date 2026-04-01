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

function countAdmins(users) {
  return users.filter((user) => user.role === 'ADMIN' && user.isActive !== false).length
}

export async function POST(request) {
  const admin = await getAdminUser()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { ids, action } = bulkSchema.parse(await request.json())
    const isActive = action === 'activate'
    const prisma = getPrisma()

    if (ids.includes(admin.id) && !isActive) {
      return NextResponse.json({ error: 'You cannot deactivate your own admin account' }, { status: 409 })
    }

    if (!prisma) {
      const selected = memoryStore.users.filter((user) => ids.includes(user.id))
      if (!isActive) {
        const remainingAdminCount =
          countAdmins(memoryStore.users) -
          selected.filter((user) => user.role === 'ADMIN' && user.isActive !== false).length
        if (remainingAdminCount < 1) {
          return NextResponse.json({ error: 'You must keep at least one active admin account' }, { status: 409 })
        }
      }

      const updatedUsers = []
      memoryStore.users.forEach((user) => {
        if (ids.includes(user.id)) {
          user.isActive = isActive
          updatedUsers.push(user)
        }
      })

      return NextResponse.json({ users: updatedUsers, action })
    }

    if (!isActive) {
      const activeAdminCount = await prisma.user.count({
        where: { role: 'ADMIN', isActive: true },
      })
      const selectedAdminCount = await prisma.user.count({
        where: { id: { in: ids }, role: 'ADMIN', isActive: true },
      })

      if (activeAdminCount - selectedAdminCount < 1) {
        return NextResponse.json({ error: 'You must keep at least one active admin account' }, { status: 409 })
      }
    }

    const users = await prisma.user.updateMany({
      where: { id: { in: ids } },
      data: { isActive },
    })

    return NextResponse.json({ users, action })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid bulk user payload', issues: error.flatten() }, { status: 400 })
    }

    return NextResponse.json({ error: 'Unable to update users' }, { status: 500 })
  }
}
