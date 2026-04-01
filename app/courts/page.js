import { SiteShell } from '@/components/site-shell'
import { CourtsExplorer } from '@/components/courts-explorer'
import { getCourtsWithAvailability } from '@/lib/courts'

export default async function CourtsPage({ searchParams }) {
  const resolvedSearchParams = await searchParams
  const courts = await getCourtsWithAvailability()
  const initialFilters = {
    q: resolvedSearchParams?.q ?? '',
    area: resolvedSearchParams?.area ?? 'all',
    sport: resolvedSearchParams?.sport ?? 'all',
    availability: resolvedSearchParams?.availability ?? 'all',
    sortBy: resolvedSearchParams?.sortBy ?? 'name',
    page: resolvedSearchParams?.page ?? '1',
  }

  return (
    <SiteShell>
      <main className="section">
        <CourtsExplorer courts={courts} initialFilters={initialFilters} />
      </main>
    </SiteShell>
  )
}
