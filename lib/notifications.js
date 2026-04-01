import { recordAuditLog } from './audit'

function getAppOrigin() {
  if (process.env.APP_URL) return process.env.APP_URL
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'http://localhost:3000'
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat('ar-EG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function normalizeEgyptPhone(phone) {
  const value = String(phone || '').replace(/\s+/g, '')
  if (!value) return null
  if (value.startsWith('+')) return value
  if (value.startsWith('0') && value.length === 11) {
    return `+20${value.slice(1)}`
  }
  if (value.length === 10) {
    return `+20${value}`
  }
  return value
}

function buildSubject(reason, courtName) {
  if (reason === 'available') return `فتحة جديدة متاحة في ${courtName}`
  return `تمت إضافة طلبك لقائمة الانتظار في ${courtName}`
}

function buildBody({ entry, court, reason }) {
  const timeLabel = formatDateTime(entry.startsAt)
  const appLink = new URL(`/courts/${court.id}`, getAppOrigin()).toString()

  if (reason === 'available') {
    return {
      subject: buildSubject(reason, court.name),
      text: `فيه فتحة جديدة متاحة في ${court.name} يوم ${timeLabel}. ادخل بسرعة من هنا: ${appLink}`,
      html: `<p>فيه فتحة جديدة متاحة في <strong>${court.name}</strong> يوم ${timeLabel}.</p><p><a href="${appLink}">افتح صفحة الملعب</a></p>`,
    }
  }

  return {
    subject: buildSubject(reason, court.name),
    text: `تمت إضافة طلبك لقائمة الانتظار في ${court.name} يوم ${timeLabel}. هنبلغك أول ما تتاح فتحة. رابط الملعب: ${appLink}`,
    html: `<p>تمت إضافة طلبك لقائمة الانتظار في <strong>${court.name}</strong> يوم ${timeLabel}.</p><p>هنبلغك أول ما تتاح فتحة.</p><p><a href="${appLink}">افتح صفحة الملعب</a></p>`,
  }
}

async function sendResendEmail({ to, subject, text, html }) {
  if (!process.env.RESEND_API_KEY || !to) {
    return { skipped: true }
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.NOTIFICATION_FROM_EMAIL || 'Multi Sport Market <onboarding@resend.dev>',
      to,
      subject,
      text,
      html,
    }),
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload?.message || 'Failed to send email notification')
  }

  return { id: payload?.id || null }
}

async function sendTwilioSms({ to, body }) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const fromNumber = process.env.TWILIO_FROM_NUMBER

  if (!accountSid || !authToken || !fromNumber || !to) {
    return { skipped: true }
  }

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      From: fromNumber,
      To: to,
      Body: body,
    }),
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload?.message || 'Failed to send SMS notification')
  }

  return { sid: payload?.sid || null }
}

export async function notifyWaitlistEntry({ entry, court, reason = 'added', actor = null }) {
  const contactEmail = entry.email || entry.user?.email || null
  const contactPhone = normalizeEgyptPhone(entry.phone)
  const message = buildBody({ entry, court, reason })

  const results = await Promise.allSettled([
    sendResendEmail({
      to: contactEmail,
      subject: message.subject,
      text: message.text,
      html: message.html,
    }),
    sendTwilioSms({
      to: contactPhone,
      body: message.text,
    }),
  ])

  return {
    email: results[0],
    sms: results[1],
  }
}

export async function notifyWaitlistEntries({ entries = [], court, reason = 'available', actor = null }) {
  const results = []

  for (const entry of entries) {
    try {
      const result = await notifyWaitlistEntry({ entry, court: entry.court || court, reason })
      results.push({ entryId: entry.id, ...result })

      await recordAuditLog({
        actorId: actor?.id || entry.userId || null,
        actorName: actor?.name || entry.customerName || 'Waitlist entry',
        actorRole: actor?.role || null,
        action: 'NOTIFY',
        entityType: 'WAITLIST',
        entityId: entry.id,
        message:
          reason === 'available'
            ? `تم إرسال إشعار بفتح فتحة جديدة في ${entry.court?.name || court?.name || 'الملعب'}`
            : `تم تأكيد إضافة طلب الانتظار في ${entry.court?.name || court?.name || 'الملعب'}`,
        metadata: {
          reason,
          email: Boolean(entry.email || entry.user?.email),
          sms: Boolean(entry.phone),
          channels: {
            email: result.email,
            sms: result.sms,
          },
        },
      })
    } catch (error) {
      results.push({ entryId: entry.id, error: error instanceof Error ? error.message : 'notification failed' })
      console.warn('waitlist notification failed', error)
    }
  }

  return results
}

export { normalizeEgyptPhone }
