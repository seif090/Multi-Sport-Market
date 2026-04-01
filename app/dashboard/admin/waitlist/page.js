import { SiteShell } from '@/components/site-shell'
import { AdminWaitlistBoard } from '@/components/admin-waitlist-board'
import { requireRole } from '@/lib/auth'
import { getAllCourts } from '@/lib/courts'

export default async function AdminWaitlistPage() {
  await requireRole(['ADMIN'])
  const courts = await getAllCourts()

  return (
    <SiteShell>
      <main className="dashboard">
        <div className="dashboard-head">
          <div>
            <p className="eyebrow">Admin tools</p>
            <h2>شاشة إدارة قائمة الانتظار</h2>
            <p className="dashboard-copy">مراجعة الطلبات، الإشعارات، والتحويل إلى حجوزات من مكان واحد.</p>
          </div>
          <div className="button-row">
            <a className="secondary-btn" href="/dashboard/admin">
              الرجوع للأدمِن
            </a>
          </div>
        </div>

        <AdminWaitlistBoard courts={courts} />
      </main>
    </SiteShell>
  )
}
