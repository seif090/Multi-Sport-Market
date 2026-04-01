'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

const priceRank = {
  low: 1,
  mid: 2,
  high: 3,
}

const allowedSorts = new Set(['name', 'price-asc', 'price-desc', 'area', 'availability'])

function normalizeFilters(source = {}) {
  const query = typeof source.q === 'string' ? source.q : ''
  const area = typeof source.area === 'string' ? source.area : 'all'
  const sport = typeof source.sport === 'string' ? source.sport : 'all'
  const availability = source.availability === 'now' ? 'now' : 'all'
  const sortBy = allowedSorts.has(source.sortBy) ? source.sortBy : 'name'
  const pageNumber = Number.parseInt(source.page, 10)

  return {
    query,
    area,
    sport,
    availability,
    sortBy,
    page: Number.isFinite(pageNumber) && pageNumber > 0 ? pageNumber : 1,
  }
}

function serializeFilters(filters) {
  const params = new URLSearchParams()

  if (filters.query) params.set('q', filters.query)
  if (filters.area !== 'all') params.set('area', filters.area)
  if (filters.sport !== 'all') params.set('sport', filters.sport)
  if (filters.availability !== 'all') params.set('availability', filters.availability)
  if (filters.sortBy !== 'name') params.set('sortBy', filters.sortBy)
  if (filters.page > 1) params.set('page', String(filters.page))

  return params.toString()
}

function filtersEqual(left, right) {
  return (
    left.query === right.query &&
    left.area === right.area &&
    left.sport === right.sport &&
    left.availability === right.availability &&
    left.sortBy === right.sortBy &&
    left.page === right.page
  )
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

export function CourtsExplorer({ courts, initialFilters }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [filters, setFilters] = useState(() => normalizeFilters(initialFilters))
  const [linkStatus, setLinkStatus] = useState('')

  useEffect(() => {
    const nextFilters = normalizeFilters(Object.fromEntries(searchParams.entries()))
    setFilters((current) => (filtersEqual(current, nextFilters) ? current : nextFilters))
  }, [searchParams])

  useEffect(() => {
    const nextQuery = serializeFilters(filters)
    const currentQuery = searchParams.toString()

    if (nextQuery === currentQuery) {
      return
    }

    const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname
    router.replace(nextUrl, { scroll: false })
  }, [filters, pathname, router, searchParams])

  const filtered = useMemo(() => {
    const normalizedQuery = filters.query.trim().toLowerCase()

    const items = courts.filter((court) => {
      const matchesQuery =
        !normalizedQuery ||
        [court.name, court.areaLabel, court.sportLabel, court.description].some((value) =>
          String(value).toLowerCase().includes(normalizedQuery)
        )

      return (
        matchesQuery &&
        (filters.area === 'all' || court.area === filters.area) &&
        (filters.sport === 'all' || court.sport === filters.sport) &&
        (filters.availability === 'all' || Boolean(court.availableNow) === (filters.availability === 'now'))
      )
    })

    return [...items].sort((left, right) => {
      if (filters.sortBy === 'name') return left.name.localeCompare(right.name, 'ar')
      if (filters.sortBy === 'price-asc') return (priceRank[left.price] || 0) - (priceRank[right.price] || 0)
      if (filters.sortBy === 'price-desc') return (priceRank[right.price] || 0) - (priceRank[left.price] || 0)
      if (filters.sortBy === 'area') return left.areaLabel.localeCompare(right.areaLabel, 'ar')
      if (filters.sortBy === 'availability') return Number(right.availableNow) - Number(left.availableNow)
      return 0
    })
  }, [courts, filters])

  const totalPages = Math.max(1, Math.ceil(filtered.length / 6))
  const currentPage = Math.min(filters.page, totalPages)
  const visibleCourts = filtered.slice((currentPage - 1) * 6, currentPage * 6)

  useEffect(() => {
    if (filters.page !== currentPage) {
      setFilters((current) => (current.page === currentPage ? current : { ...current, page: currentPage }))
    }
  }, [currentPage, filters.page])

  function patchFilters(patch, resetPage = true) {
    setFilters((current) => ({
      ...current,
      ...patch,
      page: resetPage ? 1 : patch.page ?? current.page,
    }))
  }

  function setPage(page) {
    setFilters((current) => ({
      ...current,
      page,
    }))
  }

  async function copyShareLink() {
    if (typeof window === 'undefined') return

    try {
      await navigator.clipboard.writeText(window.location.href)
      setLinkStatus('تم نسخ الرابط')
    } catch {
      setLinkStatus('تعذر نسخ الرابط')
    }
  }

  async function shareLink() {
    if (typeof window === 'undefined') return

    const url = window.location.href

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Multi Sport Market',
          text: 'شارك فلاتر الملاعب الحالية',
          url,
        })
        setLinkStatus('تمت المشاركة')
        return
      }

      await navigator.clipboard.writeText(url)
      setLinkStatus('تم نسخ الرابط')
    } catch {
      setLinkStatus('تعذر المشاركة')
    }
  }

  async function copyPresetLink(preset) {
    if (typeof window === 'undefined') return

    const url = new URL(window.location.href)
    Object.entries(preset).forEach(([key, value]) => {
      if (value === 'all' || value === '' || value == null) {
        url.searchParams.delete(key)
      } else {
        url.searchParams.set(key, value)
      }
    })

    try {
      await navigator.clipboard.writeText(url.toString())
      setLinkStatus('تم نسخ رابط preset')
    } catch {
      setLinkStatus('تعذر نسخ رابط preset')
    }
  }

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
          <p>الفلاتر محفوظة في الرابط، فتعرف ترجع لنفس البحث بعد الريفرش أو المشاركة.</p>
        </div>

        <div className="courts-toolbar panel">
          <label>
            البحث
            <input
              value={filters.query}
              onChange={(event) => patchFilters({ query: event.target.value })}
              placeholder="ابحث بالاسم أو المنطقة أو الرياضة"
            />
          </label>
          <label>
            المنطقة
            <select value={filters.area} onChange={(event) => patchFilters({ area: event.target.value })}>
              <option value="all">كل المناطق</option>
              <option value="smouha">سموحة</option>
              <option value="sidi-gaber">سيدي جابر</option>
              <option value="san-stefano">سان ستيفانو</option>
              <option value="abor">أبو قير</option>
            </select>
          </label>
          <label>
            الرياضة
            <select value={filters.sport} onChange={(event) => patchFilters({ sport: event.target.value })}>
              <option value="all">كل الرياضات</option>
              <option value="football">كرة قدم</option>
              <option value="padel">بادل</option>
              <option value="billiards">بلياردو</option>
              <option value="playstation">بلايستيشن</option>
            </select>
          </label>
          <label>
            التوافر
            <select value={filters.availability} onChange={(event) => patchFilters({ availability: event.target.value })}>
              <option value="all">كل الملاعب</option>
              <option value="now">المتاح الآن فقط</option>
            </select>
          </label>
          <label>
            الفرز
            <select value={filters.sortBy} onChange={(event) => patchFilters({ sortBy: event.target.value })}>
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
              onClick={() =>
                setFilters({
                  query: '',
                  area: 'all',
                  sport: 'all',
                  availability: 'all',
                  sortBy: 'name',
                  page: 1,
                })
              }
              >
              إعادة الضبط
            </button>
          </div>
        </div>

        <div className="button-row courts-share-row">
          <button className="secondary-btn" type="button" onClick={shareLink}>
            مشاركة الرابط
          </button>
          <button className="secondary-btn" type="button" onClick={copyShareLink}>
            نسخ الرابط
          </button>
          {linkStatus ? <span className="table-note">{linkStatus}</span> : null}
        </div>

        <div className="button-row courts-preset-row">
          <span className="table-note">Preset filters:</span>
          <button
            className="secondary-btn"
            type="button"
            onClick={() => copyPresetLink({ area: 'smouha', availability: 'now', sortBy: 'availability', page: '1' })}
          >
            سموحة + المتاح الآن
          </button>
          <button
            className="secondary-btn"
            type="button"
            onClick={() => copyPresetLink({ sport: 'football', availability: 'now', sortBy: 'availability', page: '1' })}
          >
            كرة قدم متاح الآن
          </button>
          <button
            className="secondary-btn"
            type="button"
            onClick={() => copyPresetLink({ sport: 'padel', area: 'sidi-gaber', sortBy: 'name', page: '1' })}
          >
            بادل سيدي جابر
          </button>
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
            onClick={() => setPage(Math.max(1, currentPage - 1))}
          >
            السابق
          </button>
          <button
            className="secondary-btn"
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
          >
            التالي
          </button>
        </div>
      </section>
    </>
  )
}
