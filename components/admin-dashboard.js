'use client'

import { useEffect, useState } from 'react'

const roleLabels = {
  PLAYER: 'Player',
  VENDOR: 'Vendor',
  TECHNICIAN: 'Technician',
  ADMIN: 'Admin',
}

function tagClass(role) {
  switch (role) {
    case 'ADMIN':
      return 'status-accepted'
    case 'VENDOR':
      return 'status-new'
    case 'TECHNICIAN':
      return 'status-completed'
    default:
      return 'status-cancelled'
  }
}

export function AdminDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadData() {
    try {
      setError('')
      const response = await fetch('/api/admin/overview', { cache: 'no-store' })
      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload?.error || 'تعذر تحميل بيانات الإدارة')
      }
      setData(payload)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'حدث خطأ غير متوقع')
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

  const summary = data?.summary || { users: 0, courts: 0, bookings: 0, jobs: 0 }

  return (
    <main className="dashboard">
      <div className="dashboard-head">
        <div>
          <p className="eyebrow">Admin portal</p>
          <h2>لوحة إدارة المنصة</h2>
          <p className="dashboard-copy">رؤية شاملة للمستخدمين، الملاعب، الحجوزات، وطلبات الصيانة.</p>
        </div>
        <div className="button-row">
          <button className="primary-btn" type="button" onClick={loadData}>
            تحديث البيانات
          </button>
        </div>
      </div>

      <section className="stats-grid">
        <article className="stats-card">
          <strong>{loading ? '...' : summary.users}</strong>
          <span>المستخدمين</span>
        </article>
        <article className="stats-card">
          <strong>{loading ? '...' : summary.courts}</strong>
          <span>الملاعب</span>
        </article>
        <article className="stats-card">
          <strong>{loading ? '...' : summary.bookings}</strong>
          <span>الحجوزات</span>
        </article>
      </section>

      {error ? <p className="empty-state">{error}</p> : null}

      <section className="dashboard-layout">
        <aside className="sidebar">
          <div className="sidebar-panel">
            <p className="eyebrow">Admin</p>
            <h3>مسارات الإدارة</h3>
            <div className="sidebar-nav">
              <a className="sidebar-link active" href="#users">
                المستخدمين
              </a>
              <a className="sidebar-link" href="#courts">
                الملاعب
              </a>
              <a className="sidebar-link" href="#bookings">
                الحجوزات
              </a>
              <a className="sidebar-link" href="#jobs">
                الصيانة
              </a>
            </div>
          </div>
          <div className="sidebar-panel">
            <div className="sidebar-step">A</div>
            <p className="form-hint">الأدمِن يقدر يشوف كل الكيانات، بينما الأدوار الأخرى تظل محدودة بصلاحياتها.</p>
          </div>
        </aside>

        <div className="dashboard-main">
          <article className="table-panel" id="users">
            <div className="table-head">
              <div>
                <p className="eyebrow">Users</p>
                <h3>الحسابات</h3>
              </div>
              <span className="dashboard-chip">{data?.users?.length || 0} accounts</span>
            </div>
            <div className="table-list">
              {(data?.users || []).map((user) => (
                <div key={user.id} className="table-row">
                  <div>
                    <strong>{user.name}</strong>
                    <p className="table-note">{user.phone}</p>
                  </div>
                  <span className={`status-pill ${tagClass(user.role)}`}>{roleLabels[user.role] || user.role}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="dashboard-grid">
            <div className="dashboard-card" id="courts">
              <div className="dashboard-head">
                <h3>الملاعب</h3>
                <span className="dashboard-chip">{data?.courts?.length || 0}</span>
              </div>
              <p className="table-note">الملاعب المسجلة والمعروضة على المنصة.</p>
            </div>
            <div className="dashboard-card" id="bookings">
              <div className="dashboard-head">
                <h3>الحجوزات</h3>
                <span className="dashboard-chip">{data?.bookings?.length || 0}</span>
              </div>
              <p className="table-note">معاينة الحجوزات الحالية لحل التعارضات بسرعة.</p>
            </div>
            <div className="dashboard-card" id="jobs">
              <div className="dashboard-head">
                <h3>الصيانة</h3>
                <span className="dashboard-chip">{data?.jobs?.length || 0}</span>
              </div>
              <p className="table-note">طلبات الصيانة والنطاق التشغيلي للفنيين.</p>
            </div>
          </article>
        </div>
      </section>
    </main>
  )
}
