import { overlaps } from './scheduling'
import { notifyWaitlistEntries } from './notifications'

export function findMatchingWaitlistEntries(entries = [], booking, limit = 3) {
  return entries
    .filter((entry) => {
      if (entry.status && entry.status !== 'WAITING') return false
      if (entry.courtId !== booking.courtId) return false
      return overlaps(
        new Date(entry.startsAt),
        new Date(entry.endsAt),
        new Date(booking.startsAt),
        new Date(booking.endsAt)
      )
    })
    .sort((a, b) => new Date(a.createdAt || a.startsAt) - new Date(b.createdAt || b.startsAt))
    .slice(0, limit)
}

export async function notifyCourtWaitlist({ court, booking, entries = [] }) {
  const matches = findMatchingWaitlistEntries(entries, booking)
  if (!matches.length) {
    return []
  }

  const notifications = await notifyWaitlistEntries({
    entries: matches,
    court,
    reason: 'available',
  })

  return notifications
}
