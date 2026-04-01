'use client'

import { useEffect, useMemo, useState } from 'react'
import { downloadCsv } from '@/lib/csv'

function formatValue(value) {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'object') return JSON.stringify(value, null, 2)
  return String(value)
}

function buildDiff(before, after) {
  const keys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})])

  return [...keys]
    .map((key) => ({
      key,
      before: before?.[key],
      after: after?.[key],
    }))
    .filter((item) => JSON.stringify(item.before) !== JSON.stringify(item.after))
}

function prettyDate(value) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return String(value)
  }
}

export function AdminAuditPanel() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [entityType, setEntityType] = useState('all')
  const [action, setAction] = useState('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [selectedLogId, setSelectedLogId] = useState('')

  async function loadLogs() {
    setLoading(true)
    try {
      const query = new URLSearchParams()
      if (entityType !== 'all') query.set('entityType', entityType)
      if (action !== 'all') query.set('action', action)
      if (fromDate) query.set('from', fromDate)
      if (toDate) query.set('to', toDate)

      const response = await fetch(`/api/admin/audit${query.toString() ? `?${query.toString()}` : ''}`, {
        cache: 'no-store',
      })
      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload?.error || 'Unable to load audit logs')
      }

      setLogs(payload.logs || [])
      setSelectedLogId((current) => current || payload.logs?.[0]?.id || '')
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load audit logs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLogs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityType, action, fromDate, toDate])

  const selectedLog = useMemo(
    () => logs.find((log) => log.id === selectedLogId) || logs[0] || null,
    [logs, selectedLogId]
  )

  const selectedMetadata = selectedLog?.metadata && typeof selectedLog.metadata === 'object' ? selectedLog.metadata : null
  const diffEntries = useMemo(() => {
    if (!selectedMetadata?.before || !selectedMetadata?.after) return []
    return buildDiff(selectedMetadata.before, selectedMetadata.after)
  }, [selectedMetadata])

  function exportCsv() {
    const rows = [
      ['Time', 'Action', 'Entity', 'Entity ID', 'Message', 'Actor', 'Role', 'Metadata'],
      ...logs.map((log) => [
        log.createdAt || '',
        log.action || '',
        log.entityType || '',
        log.entityId || '',
        log.message || '',
        log.actorName || '',
        log.actorRole || '',
        log.metadata ? JSON.stringify(log.metadata) : '',
      ]),
    ]
    downloadCsv('audit-log.csv', rows)
  }

  return (
    <section className="panel analytics-panel">
      <div className="table-head">
        <div>
          <p className="eyebrow">Audit trail</p>
          <h3>سجل التعديلات والإنذارات</h3>
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
        <label>
          From
          <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
        </label>
        <label>
          To
          <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
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

      <div className="admin-detail-layout">
        <div className="table-list compact">
          {loading ? (
            <div className="empty-state">جارٍ التحميل...</div>
          ) : logs.length ? (
            logs.map((log) => (
              <button
                key={log.id}
                type="button"
                className={`table-row table-row--button ${selectedLog?.id === log.id ? 'is-selected' : ''}`}
                onClick={() => setSelectedLogId(log.id)}
              >
                <div>
                  <strong>{formatValue(log.message)}</strong>
                  <p className="table-note">
                    {formatValue(log.actorName)} · {formatValue(log.entityType)} · {prettyDate(log.createdAt)}
                  </p>
                </div>
                <div className="row-actions">
                  <span className="tag">{formatValue(log.action)}</span>
                  <span className="tag">{formatValue(log.entityId)}</span>
                </div>
              </button>
            ))
          ) : (
            <div className="empty-state">مفيش سجلات لسه.</div>
          )}
        </div>

        <aside className="panel audit-detail-panel">
          <div className="table-head">
            <div>
              <p className="eyebrow">Selected event</p>
              <h3>تفاصيل السجل</h3>
            </div>
          </div>

          {selectedLog ? (
            <div className="audit-detail">
              <div className="preview-card">
                <div className="row-actions">
                  <span className="tag">{formatValue(selectedLog.action)}</span>
                  <span className="tag">{formatValue(selectedLog.entityType)}</span>
                  <span className="tag">{prettyDate(selectedLog.createdAt)}</span>
                </div>
                <p className="table-note">{formatValue(selectedLog.message)}</p>
                <p className="table-note">
                  {formatValue(selectedLog.actorName)} · {formatValue(selectedLog.actorRole)} · {formatValue(selectedLog.entityId)}
                </p>
              </div>

              {diffEntries.length ? (
                <div className="preview-card">
                  <div className="table-head">
                    <div>
                      <p className="eyebrow">Before / After</p>
                      <h4>الفرق بين القيم</h4>
                    </div>
                  </div>
                  <div className="diff-list">
                    {diffEntries.map((entry) => (
                      <div key={entry.key} className="diff-row">
                        <strong>{entry.key}</strong>
                        <span>{formatValue(entry.before)}</span>
                        <span>{formatValue(entry.after)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {selectedMetadata ? (
                <details className="preview-card">
                  <summary>Metadata</summary>
                  <pre className="json-block">{JSON.stringify(selectedMetadata, null, 2)}</pre>
                </details>
              ) : null}
            </div>
          ) : (
            <p className="empty-state">اختار سجل عشان تشوف التفاصيل.</p>
          )}
        </aside>
      </div>
    </section>
  )
}
