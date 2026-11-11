import type { ContactNotification } from '@/lib/contact-types'

const DEFAULT_NOTIFY_TO = 'ahsenkurtoski@financier.com'
const DEFAULT_NOTIFY_FROM = 'ahsenkurtoski@financier.com'

export function contactNotifyTo(): string {
  return (process.env.CONTACT_NOTIFY_TO || DEFAULT_NOTIFY_TO).trim()
}

export function contactNotifyFrom(): string {
  return (process.env.CONTACT_NOTIFY_FROM || DEFAULT_NOTIFY_FROM).trim()
}

export function contactNotifyFromName(): string {
  return (process.env.CONTACT_NOTIFY_FROM_NAME || 'AhsenDS').trim()
}

export function emailNotificationsConfigured(): boolean {
  return Boolean(process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY.trim())
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function singleLine(value: string): string {
  return value.replace(/[\r\n]+/g, ' ').trim()
}

function localeLabel(locale: ContactNotification['locale']): string {
  return locale === 'en' ? 'English' : 'Italiano'
}

function buildMessage(data: ContactNotification): { subject: string; text: string; html: string } {
  const organisation = data.organisation || '—'
  const subject = 'Nuova richiesta di contatto — ' + singleLine(data.name)

  const text = [
    'Nuova richiesta di contatto — AhsenDS',
    '',
    'Nome: ' + data.name,
    'Email: ' + data.email,
    'Organizzazione: ' + organisation,
    'Lingua: ' + localeLabel(data.locale),
    'Data: ' + data.createdAt,
    'ID: ' + data.id,
    '',
    'Messaggio:',
    data.message,
    '',
    'Rispondi direttamente a questa email per contattare ' + data.name + '.',
  ].join('\n')

  const html = [
    '<div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif;max-width:640px;color:#111827;line-height:1.55">',
    '<h2 style="margin:0 0 18px;font-size:21px">Nuova richiesta di contatto</h2>',
    '<table style="border-collapse:collapse;width:100%;font-size:14px">',
    '<tr><td style="padding:7px 0;color:#6b7280;width:130px">Nome</td><td style="padding:7px 0">' + escapeHtml(data.name) + '</td></tr>',
    '<tr><td style="padding:7px 0;color:#6b7280">Email</td><td style="padding:7px 0"><a href="mailto:' + encodeURIComponent(data.email) + '">' + escapeHtml(data.email) + '</a></td></tr>',
    '<tr><td style="padding:7px 0;color:#6b7280">Organizzazione</td><td style="padding:7px 0">' + escapeHtml(organisation) + '</td></tr>',
    '<tr><td style="padding:7px 0;color:#6b7280">Lingua</td><td style="padding:7px 0">' + escapeHtml(localeLabel(data.locale)) + '</td></tr>',
    '<tr><td style="padding:7px 0;color:#6b7280">Data</td><td style="padding:7px 0">' + escapeHtml(data.createdAt) + '</td></tr>',
    '<tr><td style="padding:7px 0;color:#6b7280">ID</td><td style="padding:7px 0;font-family:monospace;font-size:12px">' + escapeHtml(data.id) + '</td></tr>',
    '</table>',
    '<h3 style="margin:22px 0 8px;font-size:15px">Messaggio</h3>',
    '<div style="white-space:pre-wrap;border-left:3px solid #34d399;padding:2px 0 2px 13px">' + escapeHtml(data.message) + '</div>',
    '<p style="margin:22px 0 0;font-size:12px;color:#6b7280">Rispondi a questa email per contattare ' + escapeHtml(data.name) + '.</p>',
    '</div>',
  ].join('')

  return { subject, text, html }
}

export type SendContactNotificationResult = {
  ok: boolean
  skipped?: boolean
  error?: string
}

export async function sendContactNotification(
  data: ContactNotification
): Promise<SendContactNotificationResult> {
  const apiKey = process.env.SENDGRID_API_KEY
  if (!apiKey || !apiKey.trim()) {
    return { ok: false, skipped: true, error: 'not_configured' }
  }

  const message = buildMessage(data)
  const payload = {
    personalizations: [{ to: [{ email: contactNotifyTo() }] }],
    from: { email: contactNotifyFrom(), name: contactNotifyFromName() },
    reply_to: { email: data.email, name: data.name },
    subject: message.subject,
    content: [
      { type: 'text/plain', value: message.text },
      { type: 'text/html', value: message.html },
    ],
    categories: ['contact-form'],
  }

  try {
    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + apiKey.trim(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
    })

    if (!res.ok) {
      // Non logghiamo il body: può contenere indirizzi o dettagli personali.
      console.error('[email] SendGrid ha rifiutato la notifica (HTTP ' + res.status + ')')
      return { ok: false, error: 'sendgrid_' + res.status }
    }

    return { ok: true }
  } catch (error) {
    console.error('[email] notifica SendGrid non inviata:', error instanceof Error ? error.name : 'network')
    return { ok: false, error: 'network' }
  }
}
