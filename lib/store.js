import { bookingsSeed, courtsSeed, maintenanceSeed, usersSeed, waitlistSeed } from './seed'
import { calculateAmountCents } from './scheduling'

const seededUsers = usersSeed.map((user) => ({ ...user, isActive: user.isActive ?? true }))
const defaultVendorId = seededUsers.find((user) => user.role === 'VENDOR')?.id || null
const defaultTechnicianId = seededUsers.find((user) => user.role === 'TECHNICIAN')?.id || null

export const memoryStore = {
  courts: courtsSeed.map((court, index) => ({
    ...court,
    id: court.id ?? `court-${index + 1}`,
    isActive: true,
    vendorId: court.vendorId ?? defaultVendorId,
  })),
  bookings: bookingsSeed.map((booking) => {
    const court = courtsSeed.find((item) => item.id === booking.courtId)
    return {
      ...booking,
      email: booking.email ?? null,
      amountCents: booking.amountCents ?? calculateAmountCents(court, booking.startsAt, booking.endsAt),
      seriesId: booking.seriesId ?? null,
      repeatPattern: booking.repeatPattern ?? 'NONE',
      repeatCount: booking.repeatCount ?? 1,
      occurrenceIndex: booking.occurrenceIndex ?? 0,
    }
  }),
  maintenanceJobs: maintenanceSeed.map((job, index) => ({
    ...job,
    id: job.id ?? `job-${index + 1}`,
    vendorId: job.vendorId ?? defaultVendorId,
    technicianId: job.technicianId ?? defaultTechnicianId,
  })),
  users: seededUsers,
  waitlistEntries: waitlistSeed.map((entry, index) => ({
    ...entry,
    id: entry.id ?? `wait-${index + 1}`,
    email: entry.email ?? null,
    status: entry.status ?? 'WAITING',
  })),
}
