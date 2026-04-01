'use client'

import { useEffect, useState } from 'react'

const roleLabels = {
  PLAYER: 'Player',
  VENDOR: 'Vendor',
  TECHNICIAN: 'Technician',
  ADMIN: 'Admin',
}

const roleOptions = ['PLAYER', 'VENDOR', 'TECHNICIAN', 'ADMIN']

function statusClass(role) {
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

function bookingStatusClass(status) {
  switch (status) {
    case 'CONFIRMED':
      return 'status-accepted'
    case 'PENDING':
      return 'status-new'
    case 'CANCELLED':
      return 'status-cancelled'
    default:
      return 'status-new'
  }
}

function maintenanceStatusClass(status) {
  switch (status) {
    case 'COMPLETED':
      return 'status-accepted'
    case 'ACCEPTED':
      return 'status-completed'
    case 'CANCELLED':
      return 'status-cancelled'
    default:
      return 'status-new'
  }
}

function createCourtDraft(court) {
  if (!court) return null

  return {
    id: court.id,
    name: court.name ?? '',
    area: court.area ?? '',
    areaLabel: court.areaLabel ?? '',
    sport: court.sport ?? '',
    sportLabel: court.sportLabel ?? '',
    price: court.price ?? '',
    priceLabel: court.priceLabel ?? '',
    badge: court.badge ?? '',
    description: court.description ?? '',
    isActive: Boolean(court.isActive),
  }
}

function createUserDraft(user) {
  if (!user) return null

  return {
    id: user.id,
    name: user.name ?? '',
    phone: user.phone ?? '',
    role: user.role ?? 'PLAYER',
    isActive: user.isActive !== false,
  }
}

function createEmptyCourtDraft() {
  return {
    name: '',
    area: 'smouha',
    areaLabel: 'سموحة',
    sport: 'football',
    sportLabel: 'كرة قدم',
    price: 'mid',
    priceLabel: 'متوسط',
    badge: 'New',
    description: '',
    isActive: true,
  }
}

function createEmptyUserDraft() {
  return {
    name: '',
    phone: '',
    role: 'PLAYER',
    isActive: true,
  }
}

export function AdminDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [savingCourt, setSavingCourt] = useState(false)
  const [savingUser, setSavingUser] = useState(false)
  const [creatingCourt, setCreatingCourt] = useState(false)
  const [creatingUser, setCreatingUser] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [selectedCourtId, setSelectedCourtId] = useState('')
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedCourtIds, setSelectedCourtIds] = useState([])
  const [selectedUserIds, setSelectedUserIds] = useState([])
  const [selectedBookingIds, setSelectedBookingIds] = useState([])
  const [selectedJobIds, setSelectedJobIds] = useState([])
  const [visibilityFilter, setVisibilityFilter] = useState('all')
  const [courtDraft, setCourtDraft] = useState(null)
  const [userDraft, setUserDraft] = useState(null)
  const [newCourtDraft, setNewCourtDraft] = useState(createEmptyCourtDraft())
  const [newUserDraft, setNewUserDraft] = useState(createEmptyUserDraft())

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

  useEffect(() => {
    if (!selectedCourtId && data?.courts?.length) {
      setSelectedCourtId(data.courts[0].id)
    }
    if (!selectedUserId && data?.users?.length) {
      setSelectedUserId(data.users[0].id)
    }
  }, [data, selectedCourtId, selectedUserId])

  useEffect(() => {
    if (!data?.courts?.length) {
      setCourtDraft(null)
      return
    }

    const court = data.courts.find((item) => item.id === selectedCourtId) || data.courts[0]
    if (court && court.id !== selectedCourtId) {
      setSelectedCourtId(court.id)
    }
    setCourtDraft(createCourtDraft(court))
  }, [data, selectedCourtId])

  useEffect(() => {
    if (!data?.users?.length) {
      setUserDraft(null)
      return
    }

    const user = data.users.find((item) => item.id === selectedUserId) || data.users[0]
    if (user && user.id !== selectedUserId) {
      setSelectedUserId(user.id)
    }
    setUserDraft(createUserDraft(user))
  }, [data, selectedUserId])

  useEffect(() => {
    if (!data?.courts?.length) {
      setSelectedCourtIds([])
      return
    }

    setSelectedCourtIds((current) => current.filter((id) => data.courts.some((court) => court.id === id)))
  }, [data])

  useEffect(() => {
    if (!data?.users?.length) {
      setSelectedUserIds([])
      return
    }

    setSelectedUserIds((current) => current.filter((id) => data.users.some((user) => user.id === id)))
  }, [data])

  useEffect(() => {
    if (!data?.bookings?.length) {
      setSelectedBookingIds([])
      return
    }

    setSelectedBookingIds((current) => current.filter((id) => data.bookings.some((booking) => booking.id === id)))
  }, [data])

  useEffect(() => {
    if (!data?.jobs?.length) {
      setSelectedJobIds([])
      return
    }

    setSelectedJobIds((current) => current.filter((id) => data.jobs.some((job) => job.id === id)))
  }, [data])

  const summary = data?.summary || { users: 0, courts: 0, bookings: 0, jobs: 0 }

  function toggleCourtSelection(courtId) {
    setSelectedCourtIds((current) =>
      current.includes(courtId) ? current.filter((id) => id !== courtId) : [...current, courtId]
    )
  }

  function toggleUserSelection(userId) {
    setSelectedUserIds((current) =>
      current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId]
    )
  }

  function setAllCourtsSelected(isSelected) {
    setSelectedCourtIds(isSelected ? visibleCourts.map((court) => court.id) : [])
  }

  function setAllUsersSelected(isSelected) {
    setSelectedUserIds(isSelected ? visibleUsers.map((user) => user.id) : [])
  }

  function setAllBookingsSelected(isSelected) {
    setSelectedBookingIds(isSelected ? (data?.bookings || []).map((booking) => booking.id) : [])
  }

  function setAllJobsSelected(isSelected) {
    setSelectedJobIds(isSelected ? (data?.jobs || []).map((job) => job.id) : [])
  }

  const visibleCourts = (data?.courts || []).filter((court) => {
    if (visibilityFilter === 'active') return court.isActive !== false
    if (visibilityFilter === 'hidden') return court.isActive === false
    return true
  })

  const visibleUsers = (data?.users || []).filter((user) => {
    if (visibilityFilter === 'active') return user.isActive !== false
    if (visibilityFilter === 'hidden') return user.isActive === false
    return true
  })

  async function saveCourt(event) {
    event.preventDefault()
    if (!courtDraft) return

    setSavingCourt(true)
    setError('')
    setNotice('')

    try {
      const response = await fetch(`/api/admin/courts/${courtDraft.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(courtDraft),
      })
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload?.error || 'تعذر حفظ بيانات الملعب')
      }

      setNotice(`تم تحديث الملعب ${payload?.court?.name || ''}`.trim())
      window.dispatchEvent(new Event('msm:data-changed'))
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'تعذر حفظ بيانات الملعب')
    } finally {
      setSavingCourt(false)
    }
  }

  async function createCourt(event) {
    event.preventDefault()
    setCreatingCourt(true)
    setError('')
    setNotice('')

    try {
      const response = await fetch('/api/admin/courts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCourtDraft),
      })
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload?.error || 'تعذر إنشاء الملعب')
      }

      setNewCourtDraft(createEmptyCourtDraft())
      setNotice(`تم إنشاء الملعب ${payload?.court?.name || ''}`.trim())
      window.dispatchEvent(new Event('msm:data-changed'))
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'تعذر إنشاء الملعب')
    } finally {
      setCreatingCourt(false)
    }
  }

  async function deleteCourt(courtId, courtName) {
    if (!window.confirm(`تعطيل الملعب "${courtName}"؟`)) {
      return
    }

    setError('')
    setNotice('')

    try {
      const response = await fetch(`/api/admin/courts/${courtId}`, {
        method: 'DELETE',
      })
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload?.error || 'تعذر حذف الملعب')
      }

      setNotice(`تم تعطيل الملعب ${payload?.court?.name || courtName}`.trim())
      window.dispatchEvent(new Event('msm:data-changed'))
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'تعذر تعطيل الملعب')
    }
  }

  async function saveUser(event) {
    event.preventDefault()
    if (!userDraft) return

    setSavingUser(true)
    setError('')
    setNotice('')

    try {
      const response = await fetch(`/api/admin/users/${userDraft.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userDraft),
      })
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload?.error || 'تعذر حفظ بيانات المستخدم')
      }

      setNotice(`تم تحديث المستخدم ${payload?.user?.name || ''}`.trim())
      window.dispatchEvent(new Event('msm:data-changed'))
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'تعذر حفظ بيانات المستخدم')
    } finally {
      setSavingUser(false)
    }
  }

  async function createUser(event) {
    event.preventDefault()
    setCreatingUser(true)
    setError('')
    setNotice('')

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUserDraft),
      })
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload?.error || 'تعذر إنشاء المستخدم')
      }

      setNewUserDraft(createEmptyUserDraft())
      setNotice(`تم إنشاء المستخدم ${payload?.user?.name || ''}`.trim())
      window.dispatchEvent(new Event('msm:data-changed'))
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'تعذر إنشاء المستخدم')
    } finally {
      setCreatingUser(false)
    }
  }

  async function deleteUser(userId, userName) {
    if (!window.confirm(`تعطيل المستخدم "${userName}"؟`)) {
      return
    }

    setError('')
    setNotice('')

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      })
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload?.error || 'تعذر حذف المستخدم')
      }

      setNotice(`تم تعطيل المستخدم ${payload?.user?.name || userName}`.trim())
      window.dispatchEvent(new Event('msm:data-changed'))
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'تعذر تعطيل المستخدم')
    }
  }

  async function bulkUpdateCourts(action) {
    if (!selectedCourtIds.length) return

    setError('')
    setNotice('')

    try {
      const response = await fetch('/api/admin/courts/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedCourtIds, action }),
      })
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload?.error || 'تعذر تنفيذ الإجراء المجمع')
      }

      setSelectedCourtIds([])
      setNotice(action === 'activate' ? 'تمت استعادة الملاعب المحددة' : 'تم تعطيل الملاعب المحددة')
      window.dispatchEvent(new Event('msm:data-changed'))
    } catch (bulkError) {
      setError(bulkError instanceof Error ? bulkError.message : 'تعذر تنفيذ الإجراء المجمع')
    }
  }

  async function bulkUpdateUsers(action) {
    if (!selectedUserIds.length) return

    setError('')
    setNotice('')

    try {
      const response = await fetch('/api/admin/users/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedUserIds, action }),
      })
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload?.error || 'تعذر تنفيذ الإجراء المجمع')
      }

      setSelectedUserIds([])
      setNotice(action === 'activate' ? 'تمت استعادة المستخدمين المحددين' : 'تم تعطيل المستخدمين المحددين')
      window.dispatchEvent(new Event('msm:data-changed'))
    } catch (bulkError) {
      setError(bulkError instanceof Error ? bulkError.message : 'تعذر تنفيذ الإجراء المجمع')
    }
  }

  async function bulkUpdateBookings(action) {
    if (!selectedBookingIds.length) return

    setError('')
    setNotice('')

    try {
      const response = await fetch('/api/admin/bookings/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedBookingIds, action }),
      })
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload?.error || 'تعذر تنفيذ الإجراء المجمع')
      }

      setSelectedBookingIds([])
      setNotice(action === 'confirm' ? 'تم تأكيد الحجوزات المحددة' : 'تم إلغاء الحجوزات المحددة')
      window.dispatchEvent(new Event('msm:data-changed'))
    } catch (bulkError) {
      setError(bulkError instanceof Error ? bulkError.message : 'تعذر تنفيذ الإجراء المجمع')
    }
  }

  async function bulkUpdateJobs(action) {
    if (!selectedJobIds.length) return

    setError('')
    setNotice('')

    try {
      const response = await fetch('/api/admin/maintenance/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedJobIds, action }),
      })
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload?.error || 'تعذر تنفيذ الإجراء المجمع')
      }

      setSelectedJobIds([])
      setNotice('تم تحديث طلبات الصيانة المحددة')
      window.dispatchEvent(new Event('msm:data-changed'))
    } catch (bulkError) {
      setError(bulkError instanceof Error ? bulkError.message : 'تعذر تنفيذ الإجراء المجمع')
    }
  }

  return (
    <main className="dashboard">
      <div className="dashboard-head">
        <div>
          <p className="eyebrow">Admin portal</p>
          <h2>لوحة إدارة المنصة</h2>
          <p className="dashboard-copy">إدارة الحسابات، الملاعب، الحجوزات، ومراجعة التشغيل من مكان واحد.</p>
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
        <article className="stats-card">
          <strong>{loading ? '...' : summary.jobs}</strong>
          <span>طلبات الصيانة</span>
        </article>
      </section>

      {error ? <p className="empty-state">{error}</p> : null}
      {notice ? <p className="notice-state">{notice}</p> : null}

      <section className="panel admin-toolbar">
        <div>
          <p className="eyebrow">Admin filters</p>
          <h3>فلتر الرؤية داخل الإدارة</h3>
        </div>
        <label>
          عرض الكيانات
          <select value={visibilityFilter} onChange={(event) => setVisibilityFilter(event.target.value)}>
            <option value="all">الكل</option>
            <option value="active">Active فقط</option>
            <option value="hidden">Hidden فقط</option>
          </select>
        </label>
      </section>

      <section className="dashboard-grid" id="creators">
        <article className="table-panel">
          <div className="table-head">
            <div>
              <p className="eyebrow">Create court</p>
              <h3>إضافة ملعب جديد</h3>
            </div>
          </div>
          <form className="editor-form" onSubmit={createCourt}>
            <div className="field-grid field-grid--two">
              <label>
                الاسم
                <input
                  value={newCourtDraft.name}
                  onChange={(event) => setNewCourtDraft({ ...newCourtDraft, name: event.target.value })}
                />
              </label>
              <label>
                الشارة
                <input
                  value={newCourtDraft.badge}
                  onChange={(event) => setNewCourtDraft({ ...newCourtDraft, badge: event.target.value })}
                />
              </label>
              <label>
                المنطقة
                <input
                  value={newCourtDraft.area}
                  onChange={(event) => setNewCourtDraft({ ...newCourtDraft, area: event.target.value })}
                />
              </label>
              <label>
                اسم المنطقة
                <input
                  value={newCourtDraft.areaLabel}
                  onChange={(event) => setNewCourtDraft({ ...newCourtDraft, areaLabel: event.target.value })}
                />
              </label>
              <label>
                الرياضة
                <input
                  value={newCourtDraft.sport}
                  onChange={(event) => setNewCourtDraft({ ...newCourtDraft, sport: event.target.value })}
                />
              </label>
              <label>
                اسم الرياضة
                <input
                  value={newCourtDraft.sportLabel}
                  onChange={(event) => setNewCourtDraft({ ...newCourtDraft, sportLabel: event.target.value })}
                />
              </label>
              <label>
                السعر
                <input
                  value={newCourtDraft.price}
                  onChange={(event) => setNewCourtDraft({ ...newCourtDraft, price: event.target.value })}
                />
              </label>
              <label>
                وصف السعر
                <input
                  value={newCourtDraft.priceLabel}
                  onChange={(event) => setNewCourtDraft({ ...newCourtDraft, priceLabel: event.target.value })}
                />
              </label>
            </div>
            <label>
              الوصف
              <textarea
                rows="4"
                value={newCourtDraft.description}
                onChange={(event) => setNewCourtDraft({ ...newCourtDraft, description: event.target.value })}
              />
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={newCourtDraft.isActive}
                onChange={(event) => setNewCourtDraft({ ...newCourtDraft, isActive: event.target.checked })}
              />
              <span>ظاهر على المنصة</span>
            </label>
            <div className="button-row">
              <button className="primary-btn" type="submit" disabled={creatingCourt}>
                {creatingCourt ? 'جارٍ الإنشاء...' : 'إنشاء ملعب'}
              </button>
            </div>
          </form>
        </article>

        <article className="table-panel">
          <div className="table-head">
            <div>
              <p className="eyebrow">Create user</p>
              <h3>إضافة مستخدم جديد</h3>
            </div>
          </div>
          <form className="editor-form" onSubmit={createUser}>
            <div className="field-grid field-grid--two">
              <label>
                الاسم
                <input
                  value={newUserDraft.name}
                  onChange={(event) => setNewUserDraft({ ...newUserDraft, name: event.target.value })}
                />
              </label>
              <label>
                الهاتف
                <input
                  value={newUserDraft.phone}
                  onChange={(event) => setNewUserDraft({ ...newUserDraft, phone: event.target.value })}
                />
              </label>
              <label>
                الدور
                <select value={newUserDraft.role} onChange={(event) => setNewUserDraft({ ...newUserDraft, role: event.target.value })}>
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>
                      {roleLabels[role]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="preview-card">
              <span className={`status-pill ${statusClass(newUserDraft.role)}`}>{roleLabels[newUserDraft.role]}</span>
              <p className="table-note">أدخل حسابًا جديدًا لتجربة الصلاحيات أو ربط مالك/فني جديد.</p>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={newUserDraft.isActive}
                  onChange={(event) => setNewUserDraft({ ...newUserDraft, isActive: event.target.checked })}
                />
                <span>الحساب نشط</span>
              </label>
            </div>
            <div className="button-row">
              <button className="primary-btn" type="submit" disabled={creatingUser}>
                {creatingUser ? 'جارٍ الإنشاء...' : 'إنشاء مستخدم'}
              </button>
            </div>
          </form>
        </article>
      </section>

      <section className="dashboard-layout">
        <aside className="sidebar">
          <div className="sidebar-panel">
            <p className="eyebrow">Admin</p>
            <h3>مسارات الإدارة</h3>
            <div className="sidebar-nav">
              <a className="sidebar-link active" href="#creators">
                الإضافة
              </a>
              <a className="sidebar-link" href="#editors">
                التعديل
              </a>
              <a className="sidebar-link" href="#users">
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
            <p className="form-hint">الأدمِن يقدر يراجع كل الكيانات ويضيف أو يعدل أو يحذف من نفس اللوحة.</p>
          </div>
        </aside>

        <div className="dashboard-main">
          <section className="dashboard-grid" id="editors">
            <article className="table-panel">
              <div className="table-head">
                <div>
                  <p className="eyebrow">Court editor</p>
                  <h3>تعديل ملعب</h3>
                </div>
                <span className="dashboard-chip">{data?.courts?.length || 0} item</span>
              </div>

              <div className="field-grid">
                <label>
                  اختيار ملعب
                  <select value={selectedCourtId} onChange={(event) => setSelectedCourtId(event.target.value)}>
                    {(data?.courts || []).map((court) => (
                      <option key={court.id} value={court.id}>
                        {court.name}
                      </option>
                    ))}
                  </select>
                </label>

                {courtDraft ? (
                  <form className="editor-form" onSubmit={saveCourt}>
                    <div className="field-grid field-grid--two">
                      <label>
                        الاسم
                        <input value={courtDraft.name} onChange={(event) => setCourtDraft({ ...courtDraft, name: event.target.value })} />
                      </label>
                      <label>
                        الشارة
                        <input value={courtDraft.badge} onChange={(event) => setCourtDraft({ ...courtDraft, badge: event.target.value })} />
                      </label>
                      <label>
                        المنطقة
                        <input value={courtDraft.area} onChange={(event) => setCourtDraft({ ...courtDraft, area: event.target.value })} />
                      </label>
                      <label>
                        اسم المنطقة
                        <input value={courtDraft.areaLabel} onChange={(event) => setCourtDraft({ ...courtDraft, areaLabel: event.target.value })} />
                      </label>
                      <label>
                        الرياضة
                        <input value={courtDraft.sport} onChange={(event) => setCourtDraft({ ...courtDraft, sport: event.target.value })} />
                      </label>
                      <label>
                        اسم الرياضة
                        <input
                          value={courtDraft.sportLabel}
                          onChange={(event) => setCourtDraft({ ...courtDraft, sportLabel: event.target.value })}
                        />
                      </label>
                      <label>
                        السعر
                        <input value={courtDraft.price} onChange={(event) => setCourtDraft({ ...courtDraft, price: event.target.value })} />
                      </label>
                      <label>
                        وصف السعر
                        <input
                          value={courtDraft.priceLabel}
                          onChange={(event) => setCourtDraft({ ...courtDraft, priceLabel: event.target.value })}
                        />
                      </label>
                    </div>

                    <label>
                      الوصف
                      <textarea
                        rows="4"
                        value={courtDraft.description}
                        onChange={(event) => setCourtDraft({ ...courtDraft, description: event.target.value })}
                      />
                    </label>

                    <label className="checkbox-row">
                      <input
                        type="checkbox"
                        checked={courtDraft.isActive}
                        onChange={(event) => setCourtDraft({ ...courtDraft, isActive: event.target.checked })}
                      />
                      <span>الملعب ظاهر على المنصة</span>
                    </label>

                    <div className="button-row">
                      <button className="primary-btn" type="submit" disabled={savingCourt}>
                        {savingCourt ? 'جارٍ الحفظ...' : 'حفظ بيانات الملعب'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <p className="empty-state">مفيش ملاعب متاحة للتحرير.</p>
                )}
              </div>
            </article>

            <article className="table-panel">
              <div className="table-head">
                <div>
                  <p className="eyebrow">User editor</p>
                  <h3>تعديل مستخدم</h3>
                </div>
                <span className="dashboard-chip">{data?.users?.length || 0} account</span>
              </div>

              <div className="field-grid">
                <label>
                  اختيار مستخدم
                  <select value={selectedUserId} onChange={(event) => setSelectedUserId(event.target.value)}>
                    {(data?.users || []).map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </label>

                {userDraft ? (
                  <form className="editor-form" onSubmit={saveUser}>
                    <div className="field-grid field-grid--two">
                      <label>
                        الاسم
                        <input value={userDraft.name} onChange={(event) => setUserDraft({ ...userDraft, name: event.target.value })} />
                      </label>
                      <label>
                        الهاتف
                        <input value={userDraft.phone} onChange={(event) => setUserDraft({ ...userDraft, phone: event.target.value })} />
                      </label>
                      <label>
                        الدور
                        <select value={userDraft.role} onChange={(event) => setUserDraft({ ...userDraft, role: event.target.value })}>
                          {roleOptions.map((role) => (
                            <option key={role} value={role}>
                              {roleLabels[role]}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <label className="checkbox-row">
                      <input
                        type="checkbox"
                        checked={userDraft.isActive}
                        onChange={(event) => setUserDraft({ ...userDraft, isActive: event.target.checked })}
                      />
                      <span>الحساب نشط</span>
                    </label>

                    <div className="preview-card">
                      <span className={`status-pill ${statusClass(userDraft.role)}`}>{roleLabels[userDraft.role] || userDraft.role}</span>
                      <p className="table-note">التغيير هنا ينعكس فورًا على الصلاحيات الخاصة بالمستخدم.</p>
                    </div>

                    <div className="button-row">
                      <button className="primary-btn" type="submit" disabled={savingUser}>
                        {savingUser ? 'جارٍ الحفظ...' : 'حفظ بيانات المستخدم'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <p className="empty-state">مفيش مستخدمين متاحين للتحرير.</p>
                )}
              </div>
            </article>
          </section>

          <article className="table-panel" id="users">
            <div className="table-head">
              <div>
                <p className="eyebrow">Users</p>
                <h3>الحسابات</h3>
              </div>
              <div className="button-row">
                <button
                  className="secondary-btn"
                  type="button"
                  disabled={!selectedUserIds.length}
                  onClick={() => bulkUpdateUsers('deactivate')}
                >
                  تعطيل المحدد
                </button>
                <button
                  className="secondary-btn"
                  type="button"
                  disabled={!selectedUserIds.length}
                  onClick={() => bulkUpdateUsers('activate')}
                >
                  استعادة المحدد
                </button>
                <button className="secondary-btn" type="button" onClick={() => setAllUsersSelected(true)}>
                  تحديد الكل
                </button>
                <button className="secondary-btn" type="button" onClick={() => setAllUsersSelected(false)}>
                  إلغاء الكل
                </button>
                <span className="dashboard-chip">{selectedUserIds.length}/{visibleUsers.length}</span>
              </div>
            </div>
            <div className="table-list">
              {visibleUsers.map((user) => (
                <div key={user.id} className="table-row">
                  <div>
                    <strong>{user.name}</strong>
                    <p className="table-note">{user.phone}</p>
                  </div>
                  <div className="row-actions">
                    <label className="row-check">
                      <input
                        type="checkbox"
                        checked={selectedUserIds.includes(user.id)}
                        onChange={() => toggleUserSelection(user.id)}
                      />
                    </label>
                    <button className="secondary-btn" type="button" onClick={() => setSelectedUserId(user.id)}>
                      تحرير
                    </button>
                    <button className="danger-btn" type="button" onClick={() => deleteUser(user.id, user.name)}>
                      تعطيل
                    </button>
                    <span className={`status-pill ${statusClass(user.role)}`}>{roleLabels[user.role] || user.role}</span>
                    <span className={`status-pill ${user.isActive === false ? 'status-cancelled' : 'status-accepted'}`}>
                      {user.isActive === false ? 'Hidden' : 'Active'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="dashboard-grid">
            <div className="dashboard-card" id="courts">
              <div className="dashboard-head">
                <h3>الملاعب</h3>
                <div className="button-row">
                  <button
                    className="secondary-btn"
                    type="button"
                    disabled={!selectedCourtIds.length}
                    onClick={() => bulkUpdateCourts('deactivate')}
                  >
                    تعطيل المحدد
                  </button>
                  <button
                    className="secondary-btn"
                    type="button"
                    disabled={!selectedCourtIds.length}
                    onClick={() => bulkUpdateCourts('activate')}
                  >
                    استعادة المحدد
                  </button>
                  <button className="secondary-btn" type="button" onClick={() => setAllCourtsSelected(true)}>
                    تحديد الكل
                  </button>
                  <button className="secondary-btn" type="button" onClick={() => setAllCourtsSelected(false)}>
                    إلغاء الكل
                  </button>
                  <span className="dashboard-chip">{selectedCourtIds.length}/{visibleCourts.length}</span>
                </div>
              </div>
              <p className="table-note">الملاعب المسجلة والمعروضة على المنصة.</p>
              <div className="table-list compact">
                {visibleCourts.slice(0, 6).map((court) => (
                  <div key={court.id} className="table-row">
                    <div>
                      <strong>{court.name}</strong>
                      <p className="table-note">
                        {court.areaLabel} · {court.sportLabel}
                      </p>
                    </div>
                    <div className="row-actions">
                      <label className="row-check">
                        <input
                          type="checkbox"
                          checked={selectedCourtIds.includes(court.id)}
                          onChange={() => toggleCourtSelection(court.id)}
                        />
                      </label>
                      <button className="secondary-btn" type="button" onClick={() => setSelectedCourtId(court.id)}>
                        تحرير
                      </button>
                      <button className="danger-btn" type="button" onClick={() => deleteCourt(court.id, court.name)}>
                        تعطيل
                      </button>
                      <span className={`status-pill ${court.isActive ? 'status-accepted' : 'status-cancelled'}`}>
                        {court.isActive ? 'Active' : 'Hidden'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="dashboard-card" id="bookings">
              <div className="dashboard-head">
                <h3>الحجوزات</h3>
                <div className="button-row">
                  <button
                    className="secondary-btn"
                    type="button"
                    disabled={!selectedBookingIds.length}
                    onClick={() => bulkUpdateBookings('confirm')}
                  >
                    تأكيد المحدد
                  </button>
                  <button
                    className="secondary-btn"
                    type="button"
                    disabled={!selectedBookingIds.length}
                    onClick={() => bulkUpdateBookings('cancel')}
                  >
                    إلغاء المحدد
                  </button>
                  <button className="secondary-btn" type="button" onClick={() => setAllBookingsSelected(true)}>
                    تحديد الكل
                  </button>
                  <button className="secondary-btn" type="button" onClick={() => setAllBookingsSelected(false)}>
                    إلغاء الكل
                  </button>
                  <span className="dashboard-chip">{selectedBookingIds.length}/{data?.bookings?.length || 0}</span>
                </div>
              </div>
              <p className="table-note">مراجعة الحجوزات الحالية لحل التعارضات بسرعة.</p>
              <div className="table-list compact">
                {(data?.bookings || []).slice(0, 6).map((booking) => (
                  <div key={booking.id} className="table-row">
                    <div>
                      <strong>{booking.customerName}</strong>
                      <p className="table-note">{booking.court?.name || booking.courtId}</p>
                    </div>
                    <div className="row-actions">
                      <label className="row-check">
                        <input
                          type="checkbox"
                          checked={selectedBookingIds.includes(booking.id)}
                          onChange={() =>
                            setSelectedBookingIds((current) =>
                              current.includes(booking.id)
                                ? current.filter((id) => id !== booking.id)
                                : [...current, booking.id]
                            )
                          }
                        />
                      </label>
                      <span className={`status-pill ${bookingStatusClass(booking.status)}`}>{booking.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="dashboard-card" id="jobs">
              <div className="dashboard-head">
                <h3>الصيانة</h3>
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
                  <span className="dashboard-chip">{selectedJobIds.length}/{data?.jobs?.length || 0}</span>
                </div>
              </div>
              <p className="table-note">طلبات الصيانة والنطاق التشغيلي للفنيين.</p>
              <div className="table-list compact">
                {(data?.jobs || []).slice(0, 6).map((job) => (
                  <div key={job.id} className="table-row">
                    <div>
                      <strong>{job.title}</strong>
                      <p className="table-note">{job.category}</p>
                    </div>
                    <div className="row-actions">
                      <label className="row-check">
                        <input
                          type="checkbox"
                          checked={selectedJobIds.includes(job.id)}
                          onChange={() =>
                            setSelectedJobIds((current) =>
                              current.includes(job.id)
                                ? current.filter((id) => id !== job.id)
                                : [...current, job.id]
                            )
                          }
                        />
                      </label>
                      <span className={`status-pill ${maintenanceStatusClass(job.status)}`}>{job.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </article>
        </div>
      </section>
    </main>
  )
}
