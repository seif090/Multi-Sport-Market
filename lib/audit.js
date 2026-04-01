import { getPrisma } from './prisma'
import { memoryStore } from './store'

function toAuditRecord(input) {
  return {
    id: input.id || `audit-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    actorId: input.actorId || null,
    actorName: input.actorName || null,
    actorRole: input.actorRole || null,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId || null,
    message: input.message,
    metadata: input.metadata || null,
    createdAt: input.createdAt || new Date().toISOString(),
  }
}

export async function recordAuditLog(input) {
  const record = toAuditRecord(input)
  memoryStore.auditLogs.unshift(record)

  const prisma = getPrisma()
  if (!prisma) {
    return record
  }

  try {
    await prisma.auditLog.create({
      data: {
        actorId: record.actorId,
        actorName: record.actorName,
        actorRole: record.actorRole,
        action: record.action,
        entityType: record.entityType,
        entityId: record.entityId,
        message: record.message,
        metadata: record.metadata,
      },
    })
  } catch (error) {
    console.warn('audit log write failed', error)
  }

  return record
}

export async function fetchAuditLogs({ limit = 100, entityType = '', action = '' } = {}) {
  const prisma = getPrisma()

  if (!prisma) {
    return memoryStore.auditLogs
      .filter((entry) => {
        if (entityType && entry.entityType !== entityType) return false
        if (action && entry.action !== action) return false
        return true
      })
      .slice(0, limit)
  }

  try {
    return await prisma.auditLog.findMany({
      where: {
        ...(entityType ? { entityType } : {}),
        ...(action ? { action } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  } catch {
    return memoryStore.auditLogs
      .filter((entry) => {
        if (entityType && entry.entityType !== entityType) return false
        if (action && entry.action !== action) return false
        return true
      })
      .slice(0, limit)
  }
}
