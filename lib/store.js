import { bookingsSeed, courtsSeed, maintenanceSeed, usersSeed } from './seed'

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
  bookings: bookingsSeed.map((booking) => ({ ...booking })),
  maintenanceJobs: maintenanceSeed.map((job, index) => ({
    ...job,
    id: job.id ?? `job-${index + 1}`,
    vendorId: job.vendorId ?? defaultVendorId,
    technicianId: job.technicianId ?? defaultTechnicianId,
  })),
  users: seededUsers,
}
