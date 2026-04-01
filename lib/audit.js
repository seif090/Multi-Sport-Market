import { getPrisma } from './prisma'
import { memoryStore } from './store'

function normalizeDateInput(value) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function buildAuditSnapshot(entityType, entity) {
  if (!entity) return null

  switch (entityType) {
    case 'COURT':
      return {
        id: entity.id,
        name: entity.name ?? null,
        area: entity.area ?? null,
        areaLabel: entity.areaLabel ?? null,
        sport: entity.sport ?? null,
        sportLabel: entity.sportLabel ?? null,
        price: entity.price ?? null,
        priceLabel: entity.priceLabel ?? null,
        badge: entity.badge ?? null,
        description: entity.description ?? null,
        isActive: entity.isActive !== false,
        vendorId: entity.vendorId ?? null,
      }
    case 'USER':
      return {
        id: entity.id,
        name: entity.name ?? null,
        phone: entity.phone ?? null,
        email: entity.email ?? null,
        role: entity.role ?? null,
        isActive: entity.isActive !== false,
      }
    case 'BOOKING':
      return {
        id: entity.id,
        courtId: entity.courtId ?? null,
        courtName: entity.court?.name ?? entity.courtName ?? null,
        customerName: entity.customerName ?? null,
        phone: entity.phone ?? null,
        email: entity.email ?? null,
        startsAt: entity.startsAt ?? null,
        endsAt: entity.endsAt ?? null,
        status: entity.status ?? null,
        amountCents: entity.amountCents ?? null,
        repeatPattern: entity.repeatPattern ?? null,
        repeatCount: entity.repeatCount ?? null,
        occurrenceIndex: entity.occurrenceIndex ?? null,
      }
    case 'WAITLIST':
      return {
        id: entity.id,
        courtId: entity.courtId ?? null,
        courtName: entity.court?.name ?? entity.courtName ?? null,
        customerName: entity.customerName ?? null,
        phone: entity.phone ?? null,
        email: entity.email ?? null,
        startsAt: entity.startsAt ?? null,
        endsAt: entity.endsAt ?? null,
        status: entity.status ?? null,
        repeatPattern: entity.repeatPattern ?? null,
        repeatCount: entity.repeatCount ?? null,
        seriesId: entity.seriesId ?? null,
        notifiedAt: entity.notifiedAt ?? null,
        convertedBookingId: entity.convertedBookingId ?? null,
      }
    case 'MAINTENANCE':
      return {
        id: entity.id,
        title: entity.title ?? null,
        category: entity.category ?? null,
        vendorName: entity.vendorName ?? null,
        customerName: entity.customerName ?? null,
        phone: entity.phone ?? null,
        status: entity.status ?? null,
        vendorId: entity.vendorId ?? null,
        technicianId: entity.technicianId ?? null,
        notes: entity.notes ?? null,
      }
    default:
      return entity
  }
}

function toAuditRecord(input) {
  const metadata = input.metadata ? { ...input.metadata } : {}

  if (input.before !== undefined) {
    metadata.before = input.before
  }

  if (input.after !== undefined) {
    metadata.after = input.after
  }

  return {
    id: input.id || `audit-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    actorId: input.actorId || null,
    actorName: input.actorName || null,
    actorRole: input.actorRole || null,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId || null,
    message: input.message,
    metadata: Object.keys(metadata).length ? metadata : null,
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

export async function fetchAuditLogs({ limit = 100, entityType = '', action = '', from = '', to = '' } = {}) {
  const fromDate = normalizeDateInput(from)
  const toDate = normalizeDateInput(to)
  const prisma = getPrisma()

  if (!prisma) {
    return memoryStore.auditLogs
      .filter((entry) => {
        if (entityType && entry.entityType !== entityType) return false
        if (action && entry.action !== action) return false
        const createdAt = new Date(entry.createdAt)
        if (fromDate && createdAt < fromDate) return false
        if (toDate && createdAt > toDate) return false
        return true
      })
      .slice(0, limit)
  }

  try {
    return await prisma.auditLog.findMany({
      where: {
        ...(entityType ? { entityType } : {}),
        ...(action ? { action } : {}),
        ...(fromDate || toDate
          ? {
              createdAt: {
                ...(fromDate ? { gte: fromDate } : {}),
                ...(toDate ? { lte: toDate } : {}),
              },
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  } catch {
    return memoryStore.auditLogs
      .filter((entry) => {
        if (entityType && entry.entityType !== entityType) return false
        if (action && entry.action !== action) return false
        const createdAt = new Date(entry.createdAt)
        if (fromDate && createdAt < fromDate) return false
        if (toDate && createdAt > toDate) return false
        return true
      })
      .slice(0, limit)
  }
}
