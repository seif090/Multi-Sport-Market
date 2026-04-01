import Link from 'next/link'

export function SiteShell({ children }) {
  return (
    <div className="page-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Alexandria-first sports ecosystem</p>
          <h1>Multi Sport Market</h1>
        </div>
        <nav className="topbar-actions" aria-label="Main navigation">
          <Link href="/">الرئيسية</Link>
          <Link href="/dashboard/vendors">الأصحاب</Link>
          <Link href="/dashboard/technicians">الفنيون</Link>
          <Link href="/api/courts">API</Link>
        </nav>
      </header>
      {children}
    </div>
  )
}
