'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'

const priceRank = {
  low: 1,
  mid: 2,
  high: 3,
}

function CourtSummaryCard({ court }) {
  return (
    <article className="court-card">
      <div className="court-card__header">
        <div>
          <p className="court-area">{court.areaLabel}</p>
          <h4 className="court-name">{court.name}</h4>
        </div>
        <span className={`availability-pill ${court.availableNow ? 'available' : 'busy'}`}>
          {court.availableNow ? 'متاح الآن' : 'محجوز الآن'}
        </span>
      </div>
      <div className="court-meta">
        <span>{court.sportLabel}</span>
        <span>السعر: {court.priceLabel}</span>
        <span>{court.availabilityLabel}</span>
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

export function CourtsExplorer({ courts }) {
  const [query, setQuery] = useState('')
  const [area, setArea] = useState('all')
  const [sport, setSport] = useState('all')
  const [availability, setAvailability] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [page, setPage] = useState(1)
  const pageSize = 6

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    const items = courts.filter((court) => {
      const matchesQuery =
        !normalizedQuery ||
        [court.name, court.areaLabel, court.sportLabel, court.description].some((value) =>
          String(value).toLowerCase().includes(normalizedQuery)
        )

      return (
        matchesQuery &&
        (area === 'all' || court.area === area) &&
        (sport === 'all' || court.sport === sport) &&
        (availability === 'all' || Boolean(court.availableNow) === (availability === 'now'))
      )
    })

    return [...items].sort((left, right) => {
      if (sortBy === 'name') return left.name.localeCompare(right.name, 'ar')
      if (sortBy === 'price-asc') return (priceRank[left.price] || 0) - (priceRank[right.price] || 0)
      if (sortBy === 'price-desc') return (priceRank[right.price] || 0) - (priceRank[left.price] || 0)
      if (sortBy === 'area') return left.areaLabel.localeCompare(right.areaLabel, 'ar')
      if (sortBy === 'availability') return Number(right.availableNow) - Number(left.availableNow)
      return 0
    })
  }, [area, availability, courts, query, sortBy, sport])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const visibleCourts = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return (
    <>
      <section className="panel">
        <p className="eyebrow">Public courts</p>
        <h2>كل الملاعب المتاحة</h2>
        <p className="hero-text">
          استعرض الملاعب، اعرف تفاصيل كل ملعب، وفعّل فلتر المتاح الآن فقط للوصول السريع لأقرب وقت متاح.
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

        <div className="courts-toolbar panel">
          <label>
            البحث
            <input
              value={query}
              onChange={(event) => {
                setPage(1)
                setQuery(event.target.value)
              }}
              placeholder="ابحث بالاسم أو المنطقة أو الرياضة"
            />
          </label>
          <label>
            المنطقة
            <select
              value={area}
              onChange={(event) => {
                setPage(1)
                setArea(event.target.value)
              }}
            >
              <option value="all">كل المناطق</option>
              <option value="smouha">سموحة</option>
              <option value="sidi-gaber">سيدي جابر</option>
              <option value="san-stefano">سان ستيفانو</option>
              <option value="abor">أبو قير</option>
            </select>
          </label>
          <label>
            الرياضة
            <select
              value={sport}
              onChange={(event) => {
                setPage(1)
                setSport(event.target.value)
              }}
            >
              <option value="all">كل الرياضات</option>
              <option value="football">كرة قدم</option>
              <option value="padel">بادل</option>
              <option value="billiards">بلياردو</option>
              <option value="playstation">بلايستيشن</option>
            </select>
          </label>
          <label>
            التوافر
            <select
              value={availability}
              onChange={(event) => {
                setPage(1)
                setAvailability(event.target.value)
              }}
            >
              <option value="all">كل الملاعب</option>
              <option value="now">المتاح الآن فقط</option>
            </select>
          </label>
          <label>
            الفرز
            <select
              value={sortBy}
              onChange={(event) => {
                setPage(1)
                setSortBy(event.target.value)
              }}
            >
              <option value="name">الاسم</option>
              <option value="area">المنطقة</option>
              <option value="price-asc">السعر من الأقل</option>
              <option value="price-desc">السعر من الأعلى</option>
              <option value="availability">الأكثر توافرًا</option>
            </select>
          </label>
          <div className="button-row">
            <button
              className="secondary-btn"
              type="button"
              onClick={() => {
                setQuery('')
                setArea('all')
                setSport('all')
                setAvailability('all')
                setSortBy('name')
                setPage(1)
              }}
            >
              إعادة الضبط
            </button>
          </div>
        </div>

        <div className="section-head" style={{ marginTop: '18px' }}>
          <p className="table-note">{filtered.length} نتيجة مطابقة</p>
          <p className="table-note">
            صفحة {currentPage} من {totalPages}
          </p>
        </div>

        <div className="grid">
          {visibleCourts.length === 0 ? (
            <article className="court-card">
              <h4>مفيش نتائج مطابقة</h4>
              <p className="court-desc">غيّر كلمات البحث أو الفلاتر وجرب تاني.</p>
            </article>
          ) : (
            visibleCourts.map((court) => <CourtSummaryCard key={court.id} court={court} />)
          )}
        </div>

        <div className="button-row" style={{ justifyContent: 'space-between', marginTop: '18px' }}>
          <button
            className="secondary-btn"
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            السابق
          </button>
          <button
            className="secondary-btn"
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
          >
            التالي
          </button>
        </div>
      </section>
    </>
  )
}
