import { TechnicianDashboard } from '@/components/technician-dashboard'
import { requireRole } from '@/lib/auth'

export default async function TechniciansPage() {
  await requireRole(['TECHNICIAN', 'ADMIN'])
  return <TechnicianDashboard />
}
