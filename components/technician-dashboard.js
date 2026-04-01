'use client'

import { useEffect, useMemo, useState } from 'react'
import { downloadCsv } from '@/lib/csv'

function statusLabel(status) {
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

export function TechnicianDashboard() {
  const [summary, setSummary] = useState({ courts: 0, bookings: 0, jobs: 0 })
  const [maintenanceJobs, setMaintenanceJobs] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [selectedJobIds, setSelectedJobIds] = useState([])
  const [jobFilter, setJobFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadData() {
    try {
      setError('')
      const [summaryResponse, maintenanceResponse, meResponse] = await Promise.all([
        fetch('/api/dashboard/summary', { cache: 'no-store' }),
        fetch('/api/maintenance', { cache: 'no-store' }),
        fetch('/api/auth/me', { cache: 'no-store' }),
      ])

      const [summaryData, maintenanceData, meData] = await Promise.all([
        summaryResponse.json(),
        maintenanceResponse.json(),
        meResponse.json(),
      ])

      setSummary(summaryData)
      setMaintenanceJobs(maintenanceData.jobs ?? [])
      setCurrentUser(meData.user ?? null)
    } catch {
      setError('تعذر تحميل بيانات الفنيين الآن')
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

  const visibleJobs = useMemo(() => {
    const ownerJobs = maintenanceJobs.filter((job) => {
      if (!currentUser || currentUser.role === 'ADMIN') return true
      return job.technicianId === currentUser.id
    })

    if (jobFilter === 'all') return ownerJobs
    return ownerJobs.filter((job) => job.status === jobFilter.toUpperCase())
  }, [maintenanceJobs, currentUser, jobFilter])

  useEffect(() => {
    setSelectedJobIds((current) => current.filter((id) => visibleJobs.some((job) => job.id === id)))
  }, [visibleJobs])

  async function bulkUpdateJobs(action) {
    if (!selectedJobIds.length) return

    setError('')

    try {
      const response = await fetch('/api/maintenance/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedJobIds, action }),
      })
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload?.error || 'تعذر تنفيذ الإجراء المجمع')
      }

      setSelectedJobIds([])
      window.dispatchEvent(new Event('msm:data-changed'))
    } catch (bulkError) {
      setError(bulkError instanceof Error ? bulkError.message : 'تعذر تنفيذ الإجراء المجمع')
    }
  }

  function toggleJobSelection(jobId) {
    setSelectedJobIds((current) => (current.includes(jobId) ? current.filter((id) => id !== jobId) : [...current, jobId]))
  }

  function setAllJobsSelected(isSelected) {
    setSelectedJobIds(isSelected ? visibleJobs.map((job) => job.id) : [])
  }

  function exportJobsCsv() {
    const rows = [
      ['العنوان', 'الفئة', 'الملعب', 'العميل', 'الحالة', 'ملاحظات'],
      ...visibleJobs.map((job) => [
        job.title,
        job.category,
        job.vendorName,
        job.customerName,
        job.status,
        job.notes || '',
      ]),
    ]
    downloadCsv('technician-jobs.csv', rows)
  }

  const jobStats = [
    { label: 'طلبات جديدة', value: String(visibleJobs.filter((job) => job.status === 'NEW').length) },
    { label: 'مكتملة اليوم', value: String(visibleJobs.filter((job) => job.status === 'COMPLETED').length) },
    { label: 'تقييم متوسط', value: '4.8/5' },
  ]

  return (
    <main className="dashboard">
      <div className="dashboard-head">
        <div>
          <p className="eyebrow">Technician portal</p>
          <h2>لوحة تحكم الفنيين</h2>
          <p className="dashboard-copy">استلام الطلبات، تحديث الحالة، وإظهار تاريخ التنفيذ.</p>
        </div>
        <div className="button-row">
          <button className="primary-btn" type="button" onClick={loadData}>
            تحديث التوفر
          </button>
          <button className="secondary-btn" type="button">
            ملف التقييم
          </button>
        </div>
      </div>

      <section className="stats-grid">
        {jobStats.map((stat) => (
          <article key={stat.label} className="stats-card">
            <strong>{loading ? '...' : stat.value}</strong>
            <span>{stat.label}</span>
          </article>
        ))}
      </section>

      {error ? <p className="empty-state">{error}</p> : null}

      <section className="panel admin-toolbar">
        <div>
          <p className="eyebrow">Bulk controls</p>
          <h3>إدارة جماعية لطلبات الصيانة</h3>
        </div>
        <div className="admin-toolbar__filters">
          <label>
            فلتر الحالة
            <select value={jobFilter} onChange={(event) => setJobFilter(event.target.value)}>
              <option value="all">الكل</option>
              <option value="new">جديد</option>
              <option value="accepted">مقبول</option>
              <option value="completed">مكتمل</option>
              <option value="cancelled">ملغي</option>
            </select>
          </label>
        </div>
        <div className="button-row">
          <button
            className="secondary-btn"
            type="button"
            disabled={!selectedJobIds.length}
            onClick={() => bulkUpdateJobs('accept')}
          >
            قبول المحدد
          </button>
          <button
            className="secondary-btn"
            type="button"
            disabled={!selectedJobIds.length}
            onClick={() => bulkUpdateJobs('complete')}
          >
            إكمال المحدد
          </button>
          <button
            className="secondary-btn"
            type="button"
            disabled={!selectedJobIds.length}
            onClick={() => bulkUpdateJobs('cancel')}
          >
            إلغاء المحدد
          </button>
          <button className="secondary-btn" type="button" onClick={() => setAllJobsSelected(true)}>
            تحديد الكل
          </button>
          <button className="secondary-btn" type="button" onClick={() => setAllJobsSelected(false)}>
            إلغاء الكل
          </button>
          <button className="secondary-btn" type="button" onClick={exportJobsCsv}>
            Export jobs CSV
          </button>
          <span className="dashboard-chip">
            {selectedJobIds.length}/{visibleJobs.length}
          </span>
        </div>
      </section>

      <section className="dashboard-layout">
        <aside className="sidebar">
          <div className="sidebar-panel">
            <p className="eyebrow">Focus</p>
            <h3>شغل اليوم</h3>
            <div className="sidebar-nav">
              <a className="sidebar-link active" href="#jobs">
                قائمة الطلبات
              </a>
              <a className="sidebar-link" href="#ratings">
                التقييمات
              </a>
              <a className="sidebar-link" href="#contracts">
                العقود
              </a>
            </div>
          </div>
          <div className="sidebar-panel">
            <div className="sidebar-step">2</div>
            <p className="form-hint">الهدف إن الفني يشوف الطلب، يقبله، ويثبت الوقت من غير مكالمات متكررة.</p>
          </div>
        </aside>

        <div className="dashboard-main">
          <article className="table-panel" id="jobs">
            <div className="table-head">
              <div>
                <p className="eyebrow">Jobs</p>
                <h3>طلبات الصيانة</h3>
              </div>
              <span className="dashboard-chip">Warranty enabled</span>
            </div>

            <div className="table-list">
              {visibleJobs.length === 0 ? (
                <div className="empty-state">مفيش طلبات صيانة حالياً.</div>
              ) : (
                visibleJobs.slice(0, 8).map((job) => {
                  const status = statusLabel(job.status)
                  return (
                    <div key={job.id} className="table-row">
                      <div>
                        <strong>{job.title}</strong>
                        <p className="table-note">{job.vendorName}</p>
                      </div>
                      <div className="row-actions">
                        <label className="row-check">
                          <input
                            type="checkbox"
                            checked={selectedJobIds.includes(job.id)}
                            onChange={() => toggleJobSelection(job.id)}
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

          <article className="dashboard-grid" id="ratings">
            <div className="dashboard-card">
              <div className="dashboard-head">
                <h3>التقييمات</h3>
                <span className="dashboard-chip">4.8</span>
              </div>
              <p className="table-note">نظام تقييم بعد كل مهمة لضمان الجودة.</p>
            </div>
            <div className="dashboard-card" id="contracts">
              <div className="dashboard-head">
                <h3>العقود</h3>
                <span className="dashboard-chip">Annual</span>
              </div>
              <p className="table-note">عقود سنوية للملاعب النشطة وخدمة متابعة دورية.</p>
            </div>
            <div className="dashboard-card">
              <div className="dashboard-head">
                <h3>الضمان</h3>
                <span className="dashboard-chip">30 days</span>
              </div>
              <p className="table-note">كل إصلاح مرتبط بضمان واضح حتى انتهاء الفترة المتفق عليها.</p>
            </div>
          </article>
        </div>
      </section>
    </main>
  )
}
