import { VendorDashboard } from '@/components/vendor-dashboard'
import { requireRole } from '@/lib/auth'

export default async function VendorsPage() {
  await requireRole(['VENDOR', 'ADMIN'])
  return <VendorDashboard />
}
