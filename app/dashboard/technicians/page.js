const jobStats = [
  { label: 'طلبات جديدة', value: '6' },
  { label: 'مكتملة اليوم', value: '9' },
  { label: 'تقييم متوسط', value: '4.8/5' },
]

const jobs = [
  { title: 'صيانة إضاءة كشافات', vendor: 'Arena Smouha', status: 'NEW', statusClass: 'status-new' },
  { title: 'ترميم عشب صناعي', vendor: 'Jaber Court Club', status: 'ACCEPTED', statusClass: 'status-accepted' },
  { title: 'فحص جهاز بلايستيشن', vendor: 'Abu Qir Play Zone', status: 'COMPLETED', statusClass: 'status-completed' },
]

export default function TechniciansPage() {
  return (
    <main className="dashboard">
      <div className="dashboard-head">
        <div>
          <p className="eyebrow">Technician portal</p>
          <h2>لوحة تحكم الفنيين</h2>
          <p className="dashboard-copy">استلام الطلبات، تحديث الحالة، وإظهار تاريخ التنفيذ.</p>
        </div>
        <div className="button-row">
          <button className="primary-btn" type="button">
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
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </article>
        ))}
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
              {jobs.map((job) => (
                <div key={job.title} className="table-row">
                  <div>
                    <strong>{job.title}</strong>
                    <p className="table-note">{job.vendor}</p>
                  </div>
                  <span className={`status-pill ${job.statusClass}`}>{job.status}</span>
                </div>
              ))}
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
