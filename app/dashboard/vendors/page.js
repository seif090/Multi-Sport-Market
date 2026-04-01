const vendorStats = [
  { label: 'حجوزات اليوم', value: '12' },
  { label: 'الدخل المتوقع', value: '8,400 EGP' },
  { label: 'طلبات الصيانة', value: '4' },
]

const vendorBookings = [
  { time: '18:00', court: 'Arena Smouha', status: 'مؤكد', statusClass: 'status-accepted' },
  { time: '19:30', court: 'Smouha Five-A-Side', status: 'معلق', statusClass: 'status-new' },
  { time: '21:00', court: 'Jaber Court Club', status: 'مدفوع', statusClass: 'status-completed' },
]

export default function VendorsPage() {
  return (
    <main className="dashboard">
      <div className="dashboard-head">
        <div>
          <p className="eyebrow">Vendor portal</p>
          <h2>لوحة تحكم أصحاب الملاعب</h2>
          <p className="dashboard-copy">إدارة الحجوزات، العروض، والصيانة من مكان واحد.</p>
        </div>
        <div className="button-row">
          <button className="primary-btn" type="button">
            إضافة ملعب
          </button>
          <button className="secondary-btn" type="button">
            طلب صيانة
          </button>
        </div>
      </div>

      <section className="stats-grid">
        {vendorStats.map((stat) => (
          <article key={stat.label} className="stats-card">
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </article>
        ))}
      </section>

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
              {vendorBookings.map((booking) => (
                <div key={booking.time} className="table-row">
                  <div>
                    <strong>{booking.time}</strong>
                    <p className="table-note">{booking.court}</p>
                  </div>
                  <span className={`status-pill ${booking.statusClass}`}>{booking.status}</span>
                </div>
              ))}
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
                <span className="dashboard-chip">4 requests</span>
              </div>
              <p className="table-note">طلب فني للإضاءة والعشب والصيانة الدورية.</p>
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
