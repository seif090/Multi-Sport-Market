'use client'

import { useMemo, useState } from 'react'
import { CourtCard } from './court-card'
import { BookingModal } from './booking-modal'

export function FilterBoard({ courts, onBookingCreated }) {
  const [area, setArea] = useState('all')
  const [sport, setSport] = useState('all')
  const [price, setPrice] = useState('all')
  const [activeCourt, setActiveCourt] = useState(null)

  const filtered = useMemo(() => {
    return courts.filter((court) => {
      return (
        (area === 'all' || court.area === area) &&
        (sport === 'all' || court.sport === sport) &&
        (price === 'all' || court.price === price)
      )
    })
  }, [area, courts, price, sport])

  return (
    <>
      <aside className="hero-card">
        <h3>ابدأ بحثك</h3>
        <div className="filters">
          <label>
            المنطقة
            <select value={area} onChange={(event) => setArea(event.target.value)}>
              <option value="all">كل المناطق</option>
              <option value="smouha">سموحة</option>
              <option value="sidi-gaber">سيدي جابر</option>
              <option value="san-stefano">سان ستيفانو</option>
              <option value="abor">أبو قير</option>
            </select>
          </label>
          <label>
            الرياضة
            <select value={sport} onChange={(event) => setSport(event.target.value)}>
              <option value="all">كل الرياضات</option>
              <option value="football">كرة قدم</option>
              <option value="padel">بادل</option>
              <option value="billiards">بلياردو</option>
              <option value="playstation">بلايستيشن</option>
            </select>
          </label>
          <label>
            السعر
            <select value={price} onChange={(event) => setPrice(event.target.value)}>
              <option value="all">كل الأسعار</option>
              <option value="low">منخفض</option>
              <option value="mid">متوسط</option>
              <option value="high">مرتفع</option>
            </select>
          </label>
        </div>
        <button
          className="primary-btn"
          type="button"
          onClick={() => {
            setArea('all')
            setSport('all')
            setPrice('all')
          }}
        >
          إعادة الضبط
        </button>
      </aside>

      <div className="grid">
        {filtered.length === 0 ? (
          <article className="court-card">
            <h4>مفيش نتائج مطابقة دلوقتي</h4>
            <p className="court-desc">جرّب تغير الفلاتر أو امسحها عشان تشوف ملاعب أكتر.</p>
          </article>
        ) : (
          filtered.map((court) => (
              <CourtCard
              key={court.id}
              court={court}
              action={
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => {
                    setActiveCourt(court)
                  }}
                >
                  احجز الآن
                </button>
              }
            />
          ))
        )}
      </div>

      <BookingModal
        isOpen={Boolean(activeCourt)}
        court={activeCourt}
        onClose={() => setActiveCourt(null)}
        onCreated={onBookingCreated}
      />
    </>
  )
}
