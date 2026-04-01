import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin'
import { fetchAuditLogs } from '@/lib/audit'

export const runtime = 'nodejs'

export async function GET(request) {
  const admin = await getAdminUser()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const limit = Math.max(10, Math.min(Number(url.searchParams.get('limit') || 50), 200))
  const entityType = url.searchParams.get('entityType') || ''
  const action = url.searchParams.get('action') || ''

  const logs = await fetchAuditLogs({ limit, entityType, action })

  return NextResponse.json({ logs })
}
