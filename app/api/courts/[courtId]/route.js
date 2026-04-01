import { NextResponse } from 'next/server'
import { getCourtAvailability } from '@/lib/courts'

export const runtime = 'nodejs'

export async function GET(_request, { params }) {
  const { courtId } = await params
  const data = await getCourtAvailability(courtId)

  if (!data) {
    return NextResponse.json({ error: 'Court not found' }, { status: 404 })
  }

  return NextResponse.json(data)
}
