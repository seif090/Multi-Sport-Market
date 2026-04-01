import { SiteShell } from '@/components/site-shell'
import { CourtsExplorer } from '@/components/courts-explorer'
import { getCourtsWithAvailability } from '@/lib/courts'

export default async function CourtsPage() {
  const courts = await getCourtsWithAvailability()

  return (
    <SiteShell>
      <main className="section">
        <CourtsExplorer courts={courts} />
      </main>
    </SiteShell>
  )
}
