'use client'

import { useEffect, useMemo, useState } from 'react'
import { downloadCsv } from '@/lib/csv'

function bookingStatusLabel(status) {
  switch (status) {
    case 'CONFIRMED':
      return { label: 'مؤكد', className: 'status-accepted' }
    case 'CANCELLED':
      return { label: 'ملغي', className: 'status-cancelled' }
    default:
      return { label: 'معلق', className: 'status-new' }
  }
}

function maintenanceStatusLabel(status) {
  switch (status) {
    case 'COMPLETED':
      return { label: 'مكتمل', className: 'status-completed' }
    case 'ACCEPTED':
      return { label: 'مقبول', className: 'status-accepted' }
    case 'CANCELLED':
      return { label: 'ملغي', className: 'status-cancelled' }
    default:
      return { label: 'جديد', className: 'status-new' }
  }
}

function normalizeBookingFilter(status) {
  if (!status || status === 'all') return 'all'
  return status
}

export function VendorDashboard() {
  const [summary, setSummary] = useState({ courts: 0, bookings: 0, jobs: 0 })
  const [bookings, setBookings] = useState([])
  const [maintenanceJobs, setMaintenanceJobs] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [selectedBookingIds, setSelectedBookingIds] = useState([])
  const [bookingFilter, setBookingFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadData() {
    try {
      setError('')
      const [summaryResponse, bookingsResponse, maintenanceResponse, meResponse, courtsResponse] = await Promise.all([
        fetch('/api/dashboard/summary', { cache: 'no-store' }),
        fetch('/api/bookings', { cache: 'no-store' }),
        fetch('/api/maintenance', { cache: 'no-store' }),
        fetch('/api/auth/me', { cache: 'no-store' }),
        fetch('/api/courts', { cache: 'no-store' }),
      ])

      const [summaryData, bookingsData, maintenanceData, meData, courtsData] = await Promise.all([
        summaryResponse.json(),
        bookingsResponse.json(),
        maintenanceResponse.json(),
        meResponse.json(),
        courtsResponse.json(),
      ])

      const courtMap = new Map((courtsData.courts ?? []).map((court) => [court.id, court]))
      setSummary(summaryData)
      setBookings((bookingsData.bookings ?? []).map((booking) => ({
        ...booking,
        court: booking.court ?? courtMap.get(booking.courtId) ?? null,
      })))
      setMaintenanceJobs(maintenanceData.jobs ?? [])
      setCurrentUser(meData.user ?? null)
    } catch {
      setError('تعذر تحميل بيانات اللوحة الآن')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    const handler = () => loadData()
    window.addEventListener('msm:data-changed', handler)
    return () => window.removeEventListener('msm:data-changed', handler)
  }, [])

  const visibleBookings = useMemo(() => {
    const ownerBookings = bookings.filter((booking) => {
      if (!currentUser || currentUser.role === 'ADMIN') return true
      const courtVendorId = booking.court?.vendorId
      return courtVendorId === currentUser.id
    })

    return ownerBookings.filter((booking) => {
      const status = normalizeBookingFilter(bookingFilter)
      if (status === 'all') return true
      return booking.status === status.toUpperCase()
    })
  }, [bookings, bookingFilter, currentUser])

  const visibleMaintenanceJobs = useMemo(() => {
    return maintenanceJobs.filter((job) => {
      if (!currentUser || currentUser.role === 'ADMIN') return true
      return job.vendorId === currentUser.id
    })
  }, [maintenanceJobs, currentUser])

  useEffect(() => {
    setSelectedBookingIds((current) => current.filter((id) => visibleBookings.some((booking) => booking.id === id)))
  }, [visibleBookings])

  async function bulkUpdateBookings(action) {
    if (!selectedBookingIds.length) return

    setError('')

    try {
      const response = await fetch('/api/bookings/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedBookingIds, action }),
      })
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload?.error || 'تعذر تنفيذ الإجراء المجمع')
      }

      setSelectedBookingIds([])
      window.dispatchEvent(new Event('msm:data-changed'))
    } catch (bulkError) {
      setError(bulkError instanceof Error ? bulkError.message : 'تعذر تنفيذ الإجراء المجمع')
    }
  }

  function toggleBookingSelection(bookingId) {
    setSelectedBookingIds((current) =>
      current.includes(bookingId) ? current.filter((id) => id !== bookingId) : [...current, bookingId]
    )
  }

  function setAllBookingsSelected(isSelected) {
    setSelectedBookingIds(isSelected ? visibleBookings.map((booking) => booking.id) : [])
  }

  function exportBookingsCsv() {
    const rows = [
      ['العميل', 'الهاتف', 'الملعب', 'الحالة', 'البداية', 'النهاية', 'ملاحظات'],
      ...visibleBookings.map((booking) => [
        booking.customerName,
        booking.phone,
        booking.court?.name || booking.courtId,
        booking.status,
        booking.startsAt,
        booking.endsAt,
        booking.notes || '',
      ]),
    ]
    downloadCsv('vendor-bookings.csv', rows)
  }

  function exportMaintenanceCsv() {
    const rows = [
      ['العنوان', 'الفئة', 'الموقع', 'العميل', 'الحالة', 'ملاحظات'],
      ...visibleMaintenanceJobs.map((job) => [
        job.title,
        job.category,
        job.vendorName,
        job.customerName,
        job.status,
        job.notes || '',
      ]),
    ]
    downloadCsv('vendor-maintenance.csv', rows)
  }

  const vendorStats = [
    { label: 'حجوزات اليوم', value: String(summary.bookings || visibleBookings.length) },
    { label: 'الملاعب', value: String(summary.courts) },
    { label: 'طلبات الصيانة', value: String(summary.jobs || visibleMaintenanceJobs.length) },
  ]

  return (
    <main className="dashboard">
      <div className="dashboard-head">
        <div>
          <p className="eyebrow">Vendor portal</p>
          <h2>لوحة تحكم أصحاب الملاعب</h2>
          <p className="dashboard-copy">إدارة الحجوزات والعروض والصيانة من مكان واحد.</p>
        </div>
        <div className="button-row">
          <button className="primary-btn" type="button" onClick={loadData}>
            تحديث البيانات
          </button>
          <button className="secondary-btn" type="button">
            طلب صيانة
          </button>
          <button className="secondary-btn" type="button" onClick={exportBookingsCsv}>
            Export bookings CSV
          </button>
          <button className="secondary-btn" type="button" onClick={exportMaintenanceCsv}>
            Export maintenance CSV
          </button>
        </div>
      </div>

      <section className="stats-grid">
        {vendorStats.map((stat) => (
          <article key={stat.label} className="stats-card">
            <strong>{loading ? '...' : stat.value}</strong>
            <span>{stat.label}</span>
          </article>
        ))}
      </section>

      {error ? <p className="empty-state">{error}</p> : null}

      <section className="dashboard-layout">
        <aside className="sidebar">
          <div className="sidebar-panel">
            <p className="eyebrow">Shortcuts</p>
            <h3>أدوات سريعة</h3>
            <div className="sidebar-nav">
              <a className="sidebar-link active" href="#schedule">
                المواعيد
              </a>
              <a className="sidebar-link" href="#offers">
                العروض
              </a>
              <a className="sidebar-link" href="#maintenance">
                الصيانة
              </a>
            </div>
          </div>

          <div className="sidebar-panel">
            <div className="sidebar-step">1</div>
            <p className="form-hint">كل الحجزات مرتبطة بمصدر واحد عشان نمنع التعارض ونسرّع المتابعة.</p>
          </div>
        </aside>

        <div className="dashboard-main">
          <article className="table-panel" id="schedule">
            <div className="table-head">
              <div>
                <p className="eyebrow">Schedule</p>
                <h3>الحجوزات القادمة</h3>
              </div>
              <span className="dashboard-chip">Realtime sync</span>
            </div>

            <div className="table-list">
              {visibleBookings.length === 0 ? (
                <div className="empty-state">مفيش حجوزات متاحة.</div>
              ) : (
                visibleBookings.slice(0, 6).map((booking) => {
                  const status = bookingStatusLabel(booking.status)
                  return (
                    <div key={booking.id} className="table-row">
                      <div>
                        <strong>
                          {new Date(booking.startsAt).toLocaleTimeString('ar-EG', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </strong>
                        <p className="table-note">{booking.court?.name || booking.courtId}</p>
                      </div>
                      <span className={`status-pill ${status.className}`}>{status.label}</span>
                    </div>
                  )
                })
              )}
            </div>
          </article>

          <article className="dashboard-grid" id="offers">
            <div className="dashboard-card">
              <div className="dashboard-head">
                <h3>العروض</h3>
                <span className="dashboard-chip">-20%</span>
              </div>
              <p className="table-note">تخفيض منتصف الأسبوع لرفع معدلات الإشغال.</p>
            </div>

            <div className="dashboard-card" id="maintenance">
              <div className="dashboard-head">
                <h3>الصيانة</h3>
                <span className="dashboard-chip">{visibleMaintenanceJobs.length} requests</span>
              </div>
              <div className="table-list">
                {visibleMaintenanceJobs.length === 0 ? (
                  <div className="empty-state">مفيش طلبات صيانة حالياً.</div>
                ) : (
                  visibleMaintenanceJobs.slice(0, 3).map((job) => {
                    const status = maintenanceStatusLabel(job.status)
                    return (
                      <div key={job.id} className="table-row">
                        <div>
                          <strong>{job.title}</strong>
                          <p className="table-note">{job.category}</p>
                        </div>
                        <span className={`status-pill ${status.className}`}>{status.label}</span>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            <div className="dashboard-card">
              <div className="dashboard-head">
                <h3>الاشتراكات</h3>
                <span className="dashboard-chip">SaaS</span>
              </div>
              <p className="table-note">خطة شهرية تشمل الإدارة والتقارير والمتابعة.</p>
            </div>
          </article>

          <article className="table-panel" id="bulk-bookings">
            <div className="table-head">
              <div>
                <p className="eyebrow">Bulk controls</p>
                <h3>إدارة جماعية للحجوزات</h3>
              </div>
              <div className="button-row">
                <button className="secondary-btn" type="button" onClick={() => setBookingFilter('all')}>
                  الكل
                </button>
                <button className="secondary-btn" type="button" onClick={() => setBookingFilter('pending')}>
                  معلق
                </button>
                <button className="secondary-btn" type="button" onClick={() => setBookingFilter('confirmed')}>
                  مؤكد
                </button>
                <button className="secondary-btn" type="button" onClick={() => setBookingFilter('cancelled')}>
                  ملغي
                </button>
              </div>
            </div>

            <div className="button-row">
              <button
                className="secondary-btn"
                type="button"
                disabled={!selectedBookingIds.length}
                onClick={() => bulkUpdateBookings('confirm')}
              >
                تأكيد المحدد
              </button>
              <button
                className="secondary-btn"
                type="button"
                disabled={!selectedBookingIds.length}
                onClick={() => bulkUpdateBookings('cancel')}
              >
                إلغاء المحدد
              </button>
              <button className="secondary-btn" type="button" onClick={() => setAllBookingsSelected(true)}>
                تحديد الكل
              </button>
              <button className="secondary-btn" type="button" onClick={() => setAllBookingsSelected(false)}>
                إلغاء الكل
              </button>
              <span className="dashboard-chip">
                {selectedBookingIds.length}/{visibleBookings.length}
              </span>
            </div>

            <div className="table-list compact">
              {visibleBookings.length === 0 ? (
                <div className="empty-state">مفيش نتائج مطابقة للفلتر.</div>
              ) : (
                visibleBookings.slice(0, 8).map((booking) => {
                  const status = bookingStatusLabel(booking.status)
                  return (
                    <div key={booking.id} className="table-row">
                      <div>
                        <strong>{booking.customerName}</strong>
                        <p className="table-note">{booking.court?.name || booking.courtId}</p>
                      </div>
                      <div className="row-actions">
                        <label className="row-check">
                          <input
                            type="checkbox"
                            checked={selectedBookingIds.includes(booking.id)}
                            onChange={() => toggleBookingSelection(booking.id)}
                          />
                        </label>
                        <span className={`status-pill ${status.className}`}>{status.label}</span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </article>
        </div>
      </section>
    </main>
  )
}
