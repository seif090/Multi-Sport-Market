import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'

export async function SiteShell({ children }) {
  const user = await getCurrentUser()

  return (
    <div className="page-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Alexandria-first sports ecosystem</p>
          <h1>Multi Sport Market</h1>
        </div>
        <nav className="topbar-actions" aria-label="Main navigation">
          <Link href="/">الرئيسية</Link>
          <Link href="/courts/court-1">تفاصيل ملعب</Link>
          <Link href="/dashboard/vendors">الأصحاب</Link>
          <Link href="/dashboard/technicians">الفنيون</Link>
          <Link href="/login">{user ? 'الحساب' : 'تسجيل الدخول'}</Link>
        </nav>
      </header>
      {user ? (
        <div className="session-bar">
          <span className="session-chip">
            {user.name} · {user.role}
          </span>
          <form action="/api/auth/logout" method="post">
            <button className="ghost-btn" type="submit">
              تسجيل الخروج
            </button>
          </form>
        </div>
      ) : null}
      {children}
    </div>
  )
}
