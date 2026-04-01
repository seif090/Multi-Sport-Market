'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const roleRedirects = {
  VENDOR: '/dashboard/vendors',
  TECHNICIAN: '/dashboard/technicians',
  ADMIN: '/dashboard/vendors',
}

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [form, setForm] = useState({
    name: '',
    phone: '',
    role: 'VENDOR',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload?.error || 'تعذر تسجيل الدخول')
      }

      const nextPath = searchParams.get('next')
      router.push(nextPath || payload.redirectTo || roleRedirects[form.role] || '/')
      router.refresh()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'حدث خطأ غير متوقع')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <label>
        الاسم
        <input
          required
          type="text"
          value={form.name}
          onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          placeholder="اسم صاحب الملعب أو الفني"
        />
      </label>
      <label>
        رقم الهاتف
        <input
          required
          type="tel"
          value={form.phone}
          onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
          placeholder="01xxxxxxxxx"
        />
      </label>
        <label>
          نوع الحساب
          <select value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}>
            <option value="VENDOR">صاحب ملعب</option>
            <option value="TECHNICIAN">فني</option>
            <option value="ADMIN">مدير المنصة</option>
          </select>
        </label>

      {error ? <p className="form-error">{error}</p> : null}

      <button className="primary-btn" type="submit" disabled={loading}>
        {loading ? 'جارٍ الدخول...' : 'تسجيل الدخول'}
      </button>
    </form>
  )
}
