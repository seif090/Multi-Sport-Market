import { SiteShell } from '@/components/site-shell'
import { AdminDashboard } from '@/components/admin-dashboard'
import { requireRole } from '@/lib/auth'
import { getAllCourts } from '@/lib/courts'

export default async function AdminPage() {
  await requireRole(['ADMIN'])
  const courts = await getAllCourts()

  return (
    <SiteShell>
      <AdminDashboard courts={courts} />
    </SiteShell>
  )
}
