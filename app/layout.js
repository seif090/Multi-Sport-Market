import './globals.css'

export const metadata = {
  title: 'Multi Sport Market',
  description: 'منصة حجز ملاعب وصيانة للملاعب في الإسكندرية',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  )
}
