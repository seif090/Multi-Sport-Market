import { notFound } from 'next/navigation'
import { SiteShell } from '@/components/site-shell'
import { CourtAvailabilityPanel } from '@/components/court-availability-panel'
import { getCourtAvailability } from '@/lib/courts'

export default async function CourtDetailsPage({ params }) {
  const { courtId } = await params
  const courtData = await getCourtAvailability(courtId)

  if (!courtData) {
    notFound()
  }

  const { court, bookings, slots, generatedAt } = courtData
  const initialAvailability = {
    court,
    bookings,
    slots,
    generatedAt,
    summary: {
      label: bookings.length ? 'متاح مع بعض الحجوزات' : 'متاح بالكامل',
      tone: bookings.length ? 'busy' : 'available',
      nextLabel: bookings.length ? 'راجع المواعيد القادمة' : 'ابدأ أول حجز',
    },
  }

  return (
    <SiteShell>
      <main className="section">
        <section className="detail-hero panel">
          <p className="eyebrow">Court details</p>
          <h2>{court.name}</h2>
          <p className="hero-text">{court.description}</p>
          <div className="tag-row">
            <span className="tag">{court.areaLabel}</span>
            <span className="tag">{court.sportLabel}</span>
            <span className="tag">السعر: {court.priceLabel}</span>
            <span className="tag">Last refresh: {new Date(generatedAt).toLocaleTimeString('ar-EG')}</span>
          </div>
        </section>

        <CourtAvailabilityPanel court={court} initialAvailability={initialAvailability} />
      </main>
    </SiteShell>
  )
}
