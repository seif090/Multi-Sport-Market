'use client'

import { useEffect, useMemo, useState } from 'react'
import { buildBusinessSlots, formatDayLabel } from '@/lib/scheduling'

function dayKey(value) {
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value))
}

function groupByDay(bookings, dayCount = 7) {
  const days = []

  for (let index = 0; index < dayCount; index += 1) {
    const day = new Date()
    day.setDate(day.getDate() + index)
    day.setHours(0, 0, 0, 0)

    const groupedBookings = bookings.filter((booking) => dayKey(booking.startsAt) === dayKey(day))
    days.push({
      date: day.toISOString(),
      label: formatDayLabel(day),
      bookings: groupedBookings.sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt)),
      slots: buildBusinessSlots(bookings, day),
    })
  }

  return days
}

export function AdminCalendarBoard({ courts = [], bookings = [], onRescheduled }) {
  const [selectedCourtId, setSelectedCourtId] = useState(courts[0]?.id || '')
  const [draggingBookingId, setDraggingBookingId] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!selectedCourtId && courts.length) {
      setSelectedCourtId(courts[0].id)
    }
  }, [courts, selectedCourtId])

  const selectedCourt = courts.find((court) => court.id === selectedCourtId) || courts[0] || null

  const courtBookings = useMemo(
    () => bookings.filter((booking) => booking.courtId === selectedCourtId && booking.status !== 'CANCELLED'),
    [bookings, selectedCourtId]
  )

  const calendarDays = useMemo(() => groupByDay(courtBookings), [courtBookings])

  async function rescheduleBooking(slot) {
    const booking = courtBookings.find((item) => item.id === draggingBookingId)
    if (!booking) return

    setBusy(true)
    setError('')

    try {
      const response = await fetch(`/api/admin/bookings/${booking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courtId: selectedCourtId,
          startsAt: slot.start,
          endsAt: slot.end,
        }),
      })
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload?.error || 'تعذر إعادة جدولة الحجز')
      }

      onRescheduled?.()
    } catch (moveError) {
      setError(moveError instanceof Error ? moveError.message : 'تعذر إعادة جدولة الحجز')
    } finally {
      setBusy(false)
      setDraggingBookingId(null)
    }
  }

  return (
    <section className="panel admin-calendar-panel">
      <div className="table-head">
        <div>
          <p className="eyebrow">Calendar drag and drop</p>
          <h3>إدارة الحجوزات بالسحب والإفلات</h3>
        </div>
        <div className="admin-toolbar__filters">
          <label>
            اختر الملعب
            <select value={selectedCourtId} onChange={(event) => setSelectedCourtId(event.target.value)}>
              {courts.map((court) => (
                <option key={court.id} value={court.id}>
                  {court.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <p className="table-note">
        {selectedCourt ? `اسحب أي حجز وافرشه على فتحة جديدة داخل ${selectedCourt.name}.` : 'مفيش ملاعب متاحة حالياً.'}
      </p>
      {error ? <p className="form-error">{error}</p> : null}

      <div className="calendar-board">
        {calendarDays.map((day) => (
          <article key={day.date} className="calendar-board__day">
            <div className="calendar-board__head">
              <strong>{day.label}</strong>
              <span className="dashboard-chip">{day.bookings.length} حجوزات</span>
            </div>

            <div className="calendar-board__booking-list">
              {day.bookings.length ? (
                day.bookings.map((booking) => (
                  <button
                    key={booking.id}
                    type="button"
                    className={`calendar-booking ${draggingBookingId === booking.id ? 'dragging' : ''}`}
                    draggable
                    onDragStart={() => setDraggingBookingId(booking.id)}
                    onDragEnd={() => setDraggingBookingId(null)}
                  >
                    <strong>{booking.customerName}</strong>
                    <span>{new Date(booking.startsAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                  </button>
                ))
              ) : (
                <div className="empty-state">مفيش حجوزات في اليوم ده.</div>
              )}
            </div>

            <div className="calendar-board__slots">
              {day.slots.map((slot) => (
                <button
                  key={slot.start}
                  type="button"
                  className={`calendar-slot-drop ${slot.available ? 'available' : 'taken'}`}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault()
                    if (draggingBookingId && slot.available) {
                      void rescheduleBooking(slot)
                    } else {
                      setDraggingBookingId(null)
                    }
                  }}
                >
                  <strong>{slot.label}</strong>
                  <span>{slot.available ? 'Drop to move' : 'Busy'}</span>
                </button>
              ))}
            </div>
          </article>
        ))}
      </div>

      {busy ? <p className="table-note">جارٍ تحديث الحجز...</p> : null}
    </section>
  )
}
