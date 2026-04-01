'use client'

import { useEffect, useMemo, useState } from 'react'
import { downloadCsv } from '@/lib/csv'

function waitlistStatusLabel(status) {
  switch (status) {
    case 'NOTIFIED':
      return { label: 'تم الإخطار', className: 'status-completed' }
    case 'CONVERTED':
      return { label: 'تحول', className: 'status-accepted' }
    case 'EXPIRED':
      return { label: 'منتهي', className: 'status-cancelled' }
    default:
      return { label: 'منتظر', className: 'status-new' }
  }
}

export function AdminWaitlistBoard({ courts = [] }) {
  const [waitlistEntries, setWaitlistEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [courtFilter, setCourtFilter] = useState('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [selectedIds, setSelectedIds] = useState([])

  async function loadWaitlist() {
    setLoading(true)
    try {
      const query = new URLSearchParams()
      if (statusFilter !== 'all') query.set('status', statusFilter)
      if (courtFilter !== 'all') query.set('courtId', courtFilter)
      if (fromDate) query.set('from', fromDate)
      if (toDate) query.set('to', toDate)

      const response = await fetch(`/api/admin/waitlist${query.toString() ? `?${query.toString()}` : ''}`, {
        cache: 'no-store',
      })
      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload?.error || 'تعذر تحميل قائمة الانتظار')
      }

      setWaitlistEntries(payload.waitlistEntries || [])
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'تعذر تحميل قائمة الانتظار')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadWaitlist()
  }, [statusFilter, courtFilter, fromDate, toDate])

  useEffect(() => {
    setSelectedIds((current) => current.filter((id) => waitlistEntries.some((entry) => entry.id === id)))
  }, [waitlistEntries])

  const visibleCount = waitlistEntries.length

  function toggleSelection(id) {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))
  }

  function setAllSelected(selected) {
    setSelectedIds(selected ? waitlistEntries.map((entry) => entry.id) : [])
  }

  async function bulkAction(action) {
    if (!selectedIds.length) return

    setError('')
    try {
      const response = await fetch('/api/admin/waitlist/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds, action }),
      })
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload?.error || 'تعذر تنفيذ الإجراء')
      }

      setSelectedIds([])
      await loadWaitlist()
      window.dispatchEvent(new Event('msm:data-changed'))
    } catch (bulkError) {
      setError(bulkError instanceof Error ? bulkError.message : 'تعذر تنفيذ الإجراء')
    }
  }

  function exportCsv() {
    const rows = [
      ['العميل', 'الهاتف', 'الملعب', 'الحالة', 'البداية', 'النهاية', 'الإخطار', 'ملاحظات'],
      ...waitlistEntries.map((entry) => [
        entry.customerName,
        entry.phone,
        entry.court?.name || entry.courtId,
        entry.status,
        entry.startsAt,
        entry.endsAt,
        entry.notifiedAt || '',
        entry.notes || '',
      ]),
    ]
    downloadCsv('waitlist-export.csv', rows)
  }

  const courtOptions = useMemo(() => courts || [], [courts])

  return (
    <section className="panel waitlist-panel">
      <div className="table-head">
        <div>
          <p className="eyebrow">Waitlist management</p>
          <h3>إدارة قائمة الانتظار</h3>
        </div>
        <span className="dashboard-chip">{visibleCount} طلب</span>
      </div>

      <div className="admin-toolbar__filters">
        <label>
          الحالة
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">الكل</option>
            <option value="WAITING">منتظر</option>
            <option value="NOTIFIED">تم الإخطار</option>
            <option value="CONVERTED">تحول</option>
            <option value="EXPIRED">منتهي</option>
          </select>
        </label>
        <label>
          الملعب
          <select value={courtFilter} onChange={(event) => setCourtFilter(event.target.value)}>
            <option value="all">الكل</option>
            {courtOptions.map((court) => (
              <option key={court.id} value={court.id}>
                {court.name}
              </option>
          ))}
          </select>
        </label>
        <label>
          From
          <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
        </label>
        <label>
          To
          <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
        </label>
      </div>

      <div className="button-row">
        <button className="secondary-btn" type="button" disabled={!selectedIds.length} onClick={() => bulkAction('notify')}>
          إرسال إشعار
        </button>
        <button className="secondary-btn" type="button" disabled={!selectedIds.length} onClick={() => bulkAction('convert')}>
          تحويل إلى حجز
        </button>
        <button className="secondary-btn" type="button" disabled={!selectedIds.length} onClick={() => bulkAction('expire')}>
          إنهاء المحدد
        </button>
        <button className="secondary-btn" type="button" onClick={() => setAllSelected(true)}>
          تحديد الكل
        </button>
        <button className="secondary-btn" type="button" onClick={() => setAllSelected(false)}>
          إلغاء الكل
        </button>
        <button className="secondary-btn" type="button" onClick={exportCsv}>
          Export CSV
        </button>
      </div>

      {error ? <p className="empty-state">{error}</p> : null}

      <div className="table-list compact">
        {loading ? (
          <div className="empty-state">جارٍ التحميل...</div>
        ) : waitlistEntries.length ? (
          waitlistEntries.map((entry) => {
            const status = waitlistStatusLabel(entry.status)
            return (
              <div key={entry.id} className="table-row">
                <div>
                  <strong>{entry.customerName}</strong>
                  <p className="table-note">
                    {entry.court?.name || entry.courtId} · {new Date(entry.startsAt).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}
                  </p>
                  <p className="table-note">Created: {new Date(entry.createdAt).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}</p>
                </div>
                <div className="row-actions">
                  <label className="row-check">
                    <input type="checkbox" checked={selectedIds.includes(entry.id)} onChange={() => toggleSelection(entry.id)} />
                  </label>
                  <span className={`status-pill ${status.className}`}>{status.label}</span>
                </div>
              </div>
            )
          })
        ) : (
          <div className="empty-state">مفيش عناصر في قائمة الانتظار.</div>
        )}
      </div>
    </section>
  )
}
