'use client'

import { useEffect, useMemo, useState } from 'react'
import { BookingModal } from './booking-modal'

export function CourtAvailabilityPanel({ court, initialAvailability }) {
  const [availability, setAvailability] = useState(initialAvailability)
  const [showBooking, setShowBooking] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState(null)
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

  useEffect(() => {
    const firstDay = availability?.calendar?.[0]
    const firstAvailableSlot = firstDay?.slots?.find((slot) => slot.available)
    setSelectedSlot(firstAvailableSlot || firstDay?.slots?.[0] || null)
  }, [availability?.calendar, court.id])

  const summary = availability?.summary || {
    label: 'تحميل...',
    tone: 'available',
    nextLabel: '',
  }

  const calendarDays = useMemo(() => availability?.calendar || [], [availability?.calendar])
  const selectedDay = calendarDays.find((day) => day.date === selectedSlot?.day) || calendarDays[0]
  const visibleSlots = selectedDay?.slots || availability?.slots || []

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
          <button
            className="secondary-btn"
            type="button"
            onClick={() => {
              setSelectedSlot((current) => current || visibleSlots.find((slot) => slot.available) || visibleSlots[0] || null)
              setShowBooking(true)
            }}
          >
            احجز من التقويم
          </button>
          <button className="secondary-btn" type="button" onClick={loadAvailability} disabled={loading}>
            {loading ? 'جارٍ التحديث...' : 'تحديث التوافر'}
          </button>
        </div>
      </article>

      <article className="panel">
        <p className="eyebrow">Availability calendar</p>
        <h3>تقويم المواعيد القادمة</h3>
        <div className="calendar-strip">
          {calendarDays.map((day) => (
            <button
              key={day.date}
              type="button"
              className={`calendar-day ${selectedDay?.date === day.date ? 'active' : ''}`}
              onClick={() => {
                const firstAvailable = day.slots.find((slot) => slot.available) || day.slots[0] || null
                setSelectedSlot(firstAvailable)
              }}
            >
              <strong>{day.label}</strong>
              <span>{day.slots.filter((slot) => slot.available).length} متاح</span>
            </button>
          ))}
        </div>
        <div className="slot-grid">
          {visibleSlots.map((slot) => (
            <button
              key={slot.start}
              type="button"
              className={`slot-card ${slot.available ? 'free' : 'taken'} ${selectedSlot?.start === slot.start ? 'selected' : ''}`}
              onClick={() => {
                setSelectedSlot({ ...slot, day: selectedDay?.date || availability?.generatedAt })
                setShowBooking(true)
              }}
            >
              <strong>{slot.label}</strong>
              <span>{slot.available ? 'متاح' : 'محجوز'}</span>
            </button>
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

      <article className="panel">
        <p className="eyebrow">Waitlist</p>
        <h3>قائمة الانتظار</h3>
        <div className="table-list">
          {availability?.waitlistEntries?.length ? (
            availability.waitlistEntries.map((entry) => (
              <div key={entry.id} className="table-row">
                <div>
                  <strong>{entry.customerName}</strong>
                  <p className="table-note">
                    {new Date(entry.startsAt).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}
                  </p>
                </div>
                <span className="tag">{entry.status}</span>
              </div>
            ))
          ) : (
            <div className="empty-state">مفيش قائمة انتظار حالياً.</div>
          )}
        </div>
      </article>

      <BookingModal
        isOpen={showBooking}
        court={court}
        prefillStart={selectedSlot?.start}
        onClose={() => setShowBooking(false)}
        onCreated={loadAvailability}
      />
    </section>
  )
}
