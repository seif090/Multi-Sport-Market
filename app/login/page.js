import { redirect } from 'next/navigation'
import { LoginForm } from '@/components/login-form'
import { SiteShell } from '@/components/site-shell'
import { getCurrentUser } from '@/lib/auth'
import { usersSeed } from '@/lib/seed'

export default async function LoginPage() {
  const user = await getCurrentUser()

  if (user) {
    redirect(user.role === 'TECHNICIAN' ? '/dashboard/technicians' : '/dashboard/vendors')
  }

  return (
    <SiteShell>
      <main className="section">
        <div className="login-layout">
          <section className="login-hero">
            <p className="eyebrow">Secure access</p>
            <h2>تسجيل دخول للأصحاب والفنيين</h2>
            <p className="hero-text">
              استخدم الحساب المناسب عشان تشوف الأدوات والصلاحيات اللي تخصك فقط.
            </p>
            <ul className="feature-list">
              <li>دخول خفيف بدون مكتبات إضافية</li>
              <li>جلسة موقعة وآمنة بـ HttpOnly cookie</li>
              <li>تحكم في الوصول حسب الدور</li>
            </ul>
          </section>

          <section className="panel">
            <p className="eyebrow">Login</p>
            <h3>ابدأ الجلسة</h3>
            <LoginForm />
            <div className="table-list" style={{ marginTop: '18px' }}>
              <div className="empty-state">
                <strong>حسابات تجريبية</strong>
                <p className="table-note">استخدم هذه البيانات لتجربة الصلاحيات والتنقل السريع.</p>
              </div>
              {usersSeed.map((user) => (
                <div key={user.id} className="table-row">
                  <div>
                    <strong>{user.name}</strong>
                    <p className="table-note">{user.phone}</p>
                  </div>
                  <span className="tag">{user.role}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </SiteShell>
  )
}
