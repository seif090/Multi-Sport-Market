import { FilterBoard } from '@/components/filter-board'
import { SiteShell } from '@/components/site-shell'
import { courtsSeed } from '@/lib/seed'

export default function HomePage() {
  return (
    <SiteShell>
      <main>
        <section className="hero">
          <div className="hero-copy">
            <p className="hero-tag">MVP v1</p>
            <h2>منصة واحدة لحجز الملاعب وإدارة الطلبات والصيانة في الإسكندرية</h2>
            <p className="hero-text">
              بنبدأ بالحجز الذكي في سموحة والمناطق القريبة، وبعدها نوسّع إلى أدوات إدارة الملاعب ثم سوق الصيانة للفنيين.
            </p>
            <div className="hero-metrics">
              <article>
                <strong>20+</strong>
                <span>ملعب مستهدف في أول دفعة</span>
              </article>
              <article>
                <strong>3</strong>
                <span>واجهات أساسية في الطريق</span>
              </article>
              <article>
                <strong>1</strong>
                <span>مصدر الحقيقة للحجوزات</span>
              </article>
            </div>
          </div>

          <FilterBoard courts={courtsSeed} />
        </section>

        <section className="section">
          <div className="section-head">
            <div>
              <p className="eyebrow">B2C booking</p>
              <h3>ملاعب متاحة للحجز الآن</h3>
            </div>
            <p>بحث سريع مع منع الحجوزات المزدوجة وتجربة مناسبة للجوال.</p>
          </div>

          <div className="grid">
            {courtsSeed.map((court, index) => (
              <article className="court-card" key={index}>
                <div className="court-card__header">
                  <div>
                    <p className="court-area">{court.areaLabel}</p>
                    <h4 className="court-name">{court.name}</h4>
                  </div>
                  <span className="court-badge">{court.badge}</span>
                </div>
                <div className="court-meta">
                  <span>{court.sportLabel}</span>
                  <span>السعر: {court.priceLabel}</span>
                </div>
                <p className="court-desc">{court.description}</p>
                <div className="court-actions">
                  <button className="secondary-btn" type="button">
                    احجز الآن
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="split-section">
          <article className="panel" id="vendors">
            <p className="eyebrow">Vendor portal</p>
            <h3>لوحة تحكم لصاحب الملعب</h3>
            <ul className="feature-list">
              <li>عرض الحجوزات اليومية والوقت الفاضي</li>
              <li>إدارة الأسعار والعروض في الأوقات الهادية</li>
              <li>طلب صيانة من نفس المنصة</li>
            </ul>
          </article>

          <article className="panel" id="maintenance">
            <p className="eyebrow">B2B maintenance</p>
            <h3>سوق صيانة يربط الملاعب بالفنيين</h3>
            <ul className="feature-list">
              <li>تصنيف الخدمات: أرضيات، إضاءة، تكييف، معدات</li>
              <li>تقييم الفنيين بعد التنفيذ</li>
              <li>عقود سنوية وضمانات واضحة</li>
            </ul>
          </article>
        </section>

        <section className="section">
          <div className="section-head">
            <div>
              <p className="eyebrow">Roadmap</p>
              <h3>خطة التنفيذ</h3>
            </div>
            <p>ترتيب يقلل المخاطرة: الحجز أولاً، ثم الإدارة، ثم الصيانة.</p>
          </div>

          <div className="timeline">
            <div className="timeline-item">
              <span>01</span>
              <div>
                <h4>سموحة MVP</h4>
                <p>20 ملعب كرة وحجز يدوي/نص آلي مع تتبع داخلي.</p>
              </div>
            </div>
            <div className="timeline-item">
              <span>02</span>
              <div>
                <h4>بوابة الأصحاب</h4>
                <p>إدارة مواعيد، إشعارات، وعروض على نفس الوقت الفاضي.</p>
              </div>
            </div>
            <div className="timeline-item">
              <span>03</span>
              <div>
                <h4>سوق الصيانة</h4>
                <p>طلبات خدمة، تقييمات، وضمانات تشغيلية.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </SiteShell>
  )
}
