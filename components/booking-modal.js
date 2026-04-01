'use client'

import { useMemo, useState } from 'react'

const initialForm = {
  customerName: '',
  phone: '',
  startsAt: '',
  durationMinutes: '90',
  notes: '',
}

export function BookingModal({ isOpen, court, onClose, onCreated }) {
  const [form, setForm] = useState(initialForm)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const meta = useMemo(() => {
    if (!court) return ''
    return `${court.areaLabel} · ${court.sportLabel} · ${court.priceLabel}`
  }, [court])

  if (!isOpen || !court) return null

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')
    setIsSubmitting(true)

    try {
      const starts = new Date(form.startsAt)
      const duration = Number(form.durationMinutes)
      const ends = new Date(starts.getTime() + duration * 60 * 1000)

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courtId: court.id,
          customerName: form.customerName,
          phone: form.phone,
          startsAt: starts.toISOString(),
          endsAt: ends.toISOString(),
          notes: form.notes || undefined,
        }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload?.error || 'تعذر إنشاء الحجز')
      }

      setSuccess('تم إرسال طلب الحجز بنجاح')
      setForm(initialForm)
      window.dispatchEvent(new Event('msm:data-changed'))
      onCreated?.(payload.booking)

      setTimeout(() => {
        onClose()
      }, 700)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'حدث خطأ غير متوقع')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <button className="close-btn" type="button" onClick={onClose} aria-label="إغلاق">
          ×
        </button>
        <p className="eyebrow">Booking request</p>
        <h3>{`طلب حجز - ${court.name}`}</h3>
        <p className="modal-meta">{meta}</p>

        <form className="booking-form" onSubmit={handleSubmit}>
          <label>
            الاسم
            <input
              required
              type="text"
              value={form.customerName}
              onChange={(event) => setForm((current) => ({ ...current, customerName: event.target.value }))}
              placeholder="اسمك"
            />
          </label>
          <label>
            رقم الهاتف
            <input
              required
              type="tel"
              value={form.phone}
              onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
              placeholder="01xxxxxxxxx"
            />
          </label>
          <label>
            الموعد المطلوب
            <input
              required
              type="datetime-local"
              value={form.startsAt}
              onChange={(event) => setForm((current) => ({ ...current, startsAt: event.target.value }))}
            />
          </label>
          <label>
            مدة الحجز
            <select
              value={form.durationMinutes}
              onChange={(event) => setForm((current) => ({ ...current, durationMinutes: event.target.value }))}
            >
              <option value="60">60 دقيقة</option>
              <option value="90">90 دقيقة</option>
              <option value="120">120 دقيقة</option>
            </select>
          </label>
          <label>
            ملاحظات
            <textarea
              rows="3"
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              placeholder="أي تفاصيل إضافية"
            />
          </label>

          {error ? <p className="form-error">{error}</p> : null}
          {success ? <p className="form-success">{success}</p> : null}

          <div className="form-actions">
            <button type="button" className="secondary-btn" onClick={onClose}>
              إلغاء
            </button>
            <button type="submit" className="primary-btn" disabled={isSubmitting}>
              {isSubmitting ? 'جارٍ الإرسال...' : 'تأكيد الطلب'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
