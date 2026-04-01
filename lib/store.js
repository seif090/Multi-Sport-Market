import { courtsSeed, maintenanceSeed } from './seed'

export const memoryStore = {
  courts: courtsSeed.map((court, index) => ({ ...court, id: court.id ?? `court-${index + 1}`, isActive: true })),
  bookings: [],
  maintenanceJobs: maintenanceSeed.map((job, index) => ({ ...job, id: job.id ?? `job-${index + 1}` })),
}
