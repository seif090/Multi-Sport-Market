import { bookingsSeed, courtsSeed, maintenanceSeed, usersSeed } from './seed'

export const memoryStore = {
  courts: courtsSeed.map((court, index) => ({ ...court, id: court.id ?? `court-${index + 1}`, isActive: true })),
  bookings: bookingsSeed.map((booking) => ({ ...booking })),
  maintenanceJobs: maintenanceSeed.map((job, index) => ({ ...job, id: job.id ?? `job-${index + 1}` })),
  users: usersSeed.map((user) => ({ ...user, isActive: user.isActive ?? true })),
}
