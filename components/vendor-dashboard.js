'use client'

import { useEffect, useState } from 'react'

function statusLabel(status) {
  switch (status) {
    case 'CONFIRMED':
      return { label: 'مؤكد', className: 'status-accepted' }
    case 'CANCELLED':
      return { label: 'ملغي', className: 'status-cancelled' }
    default:
      return { label: 'معلق', className: 'status-new' }
  }
}

export function VendorDashboard() {
  const [summary, setSummary] = useState({ courts: 0, bookings: 0, jobs: 0 })
  const [bookings, setBookings] = useState([])
  const [maintenanceJobs, setMaintenanceJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadData() {
    try {
      setError('')
      const [summaryResponse, bookingsResponse, maintenanceResponse] = await Promise.all([
        fetch('/api/dashboard/summary', { cache: 'no-store' }),
        fetch('/api/bookings', { cache: 'no-store' }),
        fetch('/api/maintenance', { cache: 'no-store' }),
      ])

      const [summaryData, bookingsData, maintenanceData] = await Promise.all([
        summaryResponse.json(),
        bookingsResponse.json(),
        maintenanceResponse.json(),
      ])

      setSummary(summaryData)
      setBookings(bookingsData.bookings ?? [])
      setMaintenanceJobs(maintenanceData.jobs ?? [])
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

  const vendorStats = [
    { label: 'حجوزات اليوم', value: String(summary.bookings || bookings.length) },
    { label: 'الملاعب', value: String(summary.courts) },
    { label: 'طلبات الصيانة', value: String(summary.jobs || maintenanceJobs.length) },
  ]

  return (
    <main className="dashboard">
      <div className="dashboard-head">
        <div>
          <p className="eyebrow">Vendor portal</p>
          <h2>لوحة تحكم أصحاب الملاعب</h2>
          <p className="dashboard-copy">إدارة الحجوزات، العروض، والصيانة من مكان واحد.</p>
        </div>
        <div className="button-row">
          <button className="primary-btn" type="button" onClick={loadData}>
            تحديث البيانات
          </button>
          <button className="secondary-btn" type="button">
            طلب صيانة
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
            <p className="form-hint">كل الحجزات متربطة بمصدر واحد عشان نمنع التعارض.</p>
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
              {bookings.length === 0 ? (
                <div className="empty-state">مفيش حجوزات لسه.</div>
              ) : (
                bookings.slice(0, 6).map((booking) => {
                  const status = statusLabel(booking.status)
                  return (
                    <div key={booking.id} className="table-row">
                      <div>
                        <strong>{new Date(booking.startsAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</strong>
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
                <span className="dashboard-chip">{maintenanceJobs.length} requests</span>
              </div>
              <div className="table-list">
                {maintenanceJobs.length === 0 ? (
                  <div className="empty-state">مفيش طلبات صيانة حالياً.</div>
                ) : (
                  maintenanceJobs.slice(0, 3).map((job) => (
                    <div key={job.id} className="table-row">
                      <div>
                        <strong>{job.title}</strong>
                        <p className="table-note">{job.category}</p>
                      </div>
                      <span className="tag">{job.status}</span>
                    </div>
                  ))
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
        </div>
      </section>
    </main>
  )
}
