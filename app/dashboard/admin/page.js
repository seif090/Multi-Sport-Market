import { SiteShell } from '@/components/site-shell'
import { AdminDashboard } from '@/components/admin-dashboard'
import { requireRole } from '@/lib/auth'

export default async function AdminPage() {
  await requireRole(['ADMIN'])

  return (
    <SiteShell>
      <AdminDashboard />
    </SiteShell>
  )
}
