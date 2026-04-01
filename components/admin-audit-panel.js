'use client'

import { useEffect, useState } from 'react'
import { downloadCsv } from '@/lib/csv'

function formatValue(value) {
  if (!value) return '—'
  return value
}

export function AdminAuditPanel() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [entityType, setEntityType] = useState('all')
  const [action, setAction] = useState('all')

  async function loadLogs() {
    setLoading(true)
    try {
      const query = new URLSearchParams()
      if (entityType !== 'all') query.set('entityType', entityType)
      if (action !== 'all') query.set('action', action)

      const response = await fetch(`/api/admin/audit${query.toString() ? `?${query.toString()}` : ''}`, {
        cache: 'no-store',
      })
      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload?.error || 'تعذر تحميل سجل التتبع')
      }

      setLogs(payload.logs || [])
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'تعذر تحميل سجل التتبع')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLogs()
  }, [entityType, action])

  function exportCsv() {
    const rows = [
      ['الوقت', 'الإجراء', 'الكيان', 'العنصر', 'الرسالة', 'المستخدم'],
      ...logs.map((log) => [
        log.createdAt || '',
        log.action || '',
        log.entityType || '',
        log.entityId || '',
        log.message || '',
        log.actorName || '',
      ]),
    ]
    downloadCsv('audit-log.csv', rows)
  }

  return (
    <section className="panel analytics-panel">
      <div className="table-head">
        <div>
          <p className="eyebrow">Audit trail</p>
          <h3>سجل التعديلات والإشعارات</h3>
        </div>
        <span className="dashboard-chip">{logs.length} حدث</span>
      </div>

      <div className="admin-toolbar__filters analytics-filters">
        <label>
          الكيان
          <select value={entityType} onChange={(event) => setEntityType(event.target.value)}>
            <option value="all">الكل</option>
            <option value="WAITLIST">WAITLIST</option>
            <option value="COURT">COURT</option>
            <option value="USER">USER</option>
            <option value="BOOKING">BOOKING</option>
            <option value="MAINTENANCE">MAINTENANCE</option>
          </select>
        </label>
        <label>
          الإجراء
          <select value={action} onChange={(event) => setAction(event.target.value)}>
            <option value="all">الكل</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
            <option value="NOTIFY">NOTIFY</option>
            <option value="CONVERT">CONVERT</option>
            <option value="EXPIRE">EXPIRE</option>
            <option value="LOGIN">LOGIN</option>
          </select>
        </label>
      </div>

      <div className="button-row">
        <button className="secondary-btn" type="button" onClick={loadLogs}>
          تحديث السجل
        </button>
        <button className="secondary-btn" type="button" onClick={exportCsv}>
          Export CSV
        </button>
      </div>

      {error ? <p className="empty-state">{error}</p> : null}

      <div className="table-list compact">
        {loading ? (
          <div className="empty-state">جارٍ التحميل...</div>
        ) : logs.length ? (
          logs.map((log) => (
            <div key={log.id} className="table-row">
              <div>
                <strong>{formatValue(log.message)}</strong>
                <p className="table-note">
                  {formatValue(log.actorName)} · {formatValue(log.entityType)} · {new Date(log.createdAt).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}
                </p>
              </div>
              <div className="row-actions">
                <span className="tag">{formatValue(log.action)}</span>
                <span className="tag">{formatValue(log.entityId)}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">مفيش سجلات لسه.</div>
        )}
      </div>
    </section>
  )
}
