import { SiteShell } from '@/components/site-shell'
import { CourtsExplorer } from '@/components/courts-explorer'
import { getAllCourts } from '@/lib/courts'

export default async function CourtsPage() {
  const courts = await getAllCourts()

  return (
    <SiteShell>
      <main className="section">
        <CourtsExplorer courts={courts} />
      </main>
    </SiteShell>
  )
}
