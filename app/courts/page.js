import Link from 'next/link'
import { SiteShell } from '@/components/site-shell'
import { getAllCourts } from '@/lib/courts'

function CourtSummaryCard({ court }) {
  return (
    <article className="court-card">
      <div className="court-card__header">
        <div>
          <p className="court-area">{court.areaLabel}</p>
          <h4 className="court-name">{court.name}</h4>
        </div>
        <span className="court-badge">{court.badge}</span>
      </div>
      <div className="court-meta">
        <span>{court.sportLabel}</span>
        <span>السعر: {court.priceLabel}</span>
      </div>
      <p className="court-desc">{court.description}</p>
      <div className="court-actions">
        <Link className="secondary-btn" href={`/courts/${court.id}`}>
          تفاصيل وتوافر
        </Link>
      </div>
    </article>
  )
}

export default async function CourtsPage() {
  const courts = await getAllCourts()

  return (
    <SiteShell>
      <main className="section">
        <section className="panel">
          <p className="eyebrow">Public courts</p>
          <h2>كل الملاعب المتاحة</h2>
          <p className="hero-text">
            استعرض الملاعب، اعرف تفاصيل كل ملعب، وافتح صفحة التوافر المباشر لأي ملعب قبل الحجز.
          </p>
        </section>

        <section className="section">
          <div className="section-head">
            <div>
              <p className="eyebrow">Courts index</p>
              <h3>قائمة عامة</h3>
            </div>
            <p>القائمة دي بتشتغل من نفس مصدر البيانات الداخلي سواء قاعدة البيانات أو الـ fallback.</p>
          </div>

          <div className="grid">
            {courts.map((court) => (
              <CourtSummaryCard key={court.id} court={court} />
            ))}
          </div>
        </section>
      </main>
    </SiteShell>
  )
}
