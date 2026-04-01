'use client'

import { useEffect, useState } from 'react'
import { BookingModal } from './booking-modal'

export function CourtAvailabilityPanel({ court, initialAvailability }) {
  const [availability, setAvailability] = useState(initialAvailability)
  const [showBooking, setShowBooking] = useState(false)
  const [loading, setLoading] = useState(false)

  async function loadAvailability() {
    setLoading(true)
    try {
      const response = await fetch(`/api/courts/${court.id}/availability`, { cache: 'no-store' })
      const payload = await response.json()
      if (response.ok) {
        setAvailability(payload)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAvailability()
    const interval = setInterval(loadAvailability, 12000)
    const handler = () => loadAvailability()
    window.addEventListener('msm:data-changed', handler)

    return () => {
      clearInterval(interval)
      window.removeEventListener('msm:data-changed', handler)
    }
  }, [court.id])

  const summary = availability?.summary || {
    label: 'تحميل...',
    tone: 'available',
    nextLabel: '',
  }

  return (
    <section className="court-availability-layout">
      <article className="panel detail-panel">
        <p className="eyebrow">Realtime availability</p>
        <div className="detail-header">
          <div>
            <h3>{court.name}</h3>
            <p className="dashboard-copy">{court.areaLabel} · {court.sportLabel}</p>
          </div>
          <span className={`availability-pill ${summary.tone === 'busy' ? 'busy' : 'available'}`}>
            {summary.label}
          </span>
        </div>
        <p className="table-note">{summary.nextLabel}</p>

        <div className="detail-actions">
          <button className="primary-btn" type="button" onClick={() => setShowBooking(true)}>
            احجز الآن
          </button>
          <button className="secondary-btn" type="button" onClick={loadAvailability} disabled={loading}>
            {loading ? 'جارٍ التحديث...' : 'تحديث التوافر'}
          </button>
        </div>
      </article>

      <article className="panel">
        <p className="eyebrow">Today slots</p>
        <h3>المواعيد القادمة</h3>
        <div className="slot-grid">
          {availability?.slots?.map((slot) => (
            <div key={slot.start} className={`slot-card ${slot.available ? 'free' : 'taken'}`}>
              <strong>{slot.label}</strong>
              <span>{slot.available ? 'متاح' : 'محجوز'}</span>
            </div>
          ))}
        </div>
      </article>

      <article className="panel">
        <p className="eyebrow">Bookings</p>
        <h3>الحجوزات المسجلة</h3>
        <div className="table-list">
          {availability?.bookings?.length ? (
            availability.bookings.map((booking) => (
              <div key={booking.id} className="table-row">
                <div>
                  <strong>{new Date(booking.startsAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</strong>
                  <p className="table-note">{booking.customerName}</p>
                </div>
                <span className="tag">{booking.status}</span>
              </div>
            ))
          ) : (
            <div className="empty-state">مفيش حجوزات لسه.</div>
          )}
        </div>
      </article>

      <BookingModal
        isOpen={showBooking}
        court={court}
        onClose={() => setShowBooking(false)}
        onCreated={loadAvailability}
      />
    </section>
  )
}
