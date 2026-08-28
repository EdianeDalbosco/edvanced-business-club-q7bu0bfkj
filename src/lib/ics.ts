// ICS (iCalendar) Generation Helper for Edvanced Business Club

export interface CalendarExportEvent {
  id: string
  title: string
  subtitle?: string
  date: string // ISO string
  endDate?: string // ISO string
  location?: string
  format?: 'presencial' | 'online' | 'hibrido'
  pricing?: 'gratuito' | 'pago'
  speakers?: string
  description?: string
  contactLink?: string
  origin?: 'meeting' | 'disclosure'
  authorName?: string
  authorCompany?: string
}

function formatDateToICS(dateStr?: string, fallbackHours = 2): string {
  if (!dateStr) {
    const d = new Date()
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  }
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) {
      const now = new Date()
      return now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    }
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  } catch {
    const now = new Date()
    return now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  }
}

function getEndDateToICS(startDateStr?: string, endDateStr?: string): string {
  if (endDateStr) {
    return formatDateToICS(endDateStr)
  }
  // Default duration: 2 hours after start
  try {
    const start = startDateStr ? new Date(startDateStr) : new Date()
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000)
    return end.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  } catch {
    const now = new Date()
    const end = new Date(now.getTime() + 2 * 60 * 60 * 1000)
    return end.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  }
}

function cleanTextForICS(text?: string): string {
  if (!text) return ''
  return text
    .replace(/<[^>]*>?/gm, '') // strip html
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n/g, '\\n')
    .replace(/\n/g, '\\n')
    .trim()
}

export function generateICSContent(
  events: CalendarExportEvent[],
  calendarName = 'Edvanced Business Club - Agenda',
): string {
  const nowICS = formatDateToICS(new Date().toISOString())

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Edvanced Business Club//Agenda Oficial//PT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${calendarName}`,
    'X-WR-TIMEZONE:America/Sao_Paulo',
    'X-WR-CALDESC:Eventos Oficiais e Divulgações da Rede Edvanced Business Club',
  ]

  events.forEach((ev) => {
    const uid = `${ev.id.replace(/[^a-zA-Z0-9-]/g, '')}-${Date.now()}@edvancedclub.com`
    const dtStart = formatDateToICS(ev.date)
    const dtEnd = getEndDateToICS(ev.date, ev.endDate)

    const formatLabel =
      ev.format === 'online'
        ? 'Online VIP'
        : ev.format === 'hibrido'
          ? 'Híbrido (Presencial + Online)'
          : 'Presencial'

    const pricingLabel = ev.pricing === 'pago' ? 'Pago / Inscrição Especial' : 'Gratuito / Incluso'

    const originLabel =
      ev.origin === 'meeting' ? 'Edvanced Business Club (Oficial)' : 'Divulgação de Membro VIP'

    const descParts: string[] = []
    descParts.push(`📌 Origem: ${originLabel}`)
    if (ev.subtitle) descParts.push(`🏷️ Série/Autor: ${ev.subtitle}`)
    descParts.push(`🌐 Formato: ${formatLabel}`)
    descParts.push(`💳 Cobrança: ${pricingLabel}`)
    if (ev.speakers) descParts.push(`🎤 Palestrantes: ${ev.speakers}`)
    if (ev.authorName)
      descParts.push(
        `👤 Membro Responsável: ${ev.authorName}${ev.authorCompany ? ` (${ev.authorCompany})` : ''}`,
      )
    if (ev.location) descParts.push(`📍 Local: ${ev.location}`)
    if (ev.contactLink) descParts.push(`🔗 Link/Inscrição: ${ev.contactLink}`)
    if (ev.description) {
      descParts.push(`\n📝 Detalhes:\n${ev.description.replace(/<[^>]*>?/gm, '')}`)
    }

    const cleanSummary = cleanTextForICS(
      `${ev.origin === 'meeting' ? '[Club] ' : '[Membro] '}${ev.title}`,
    )
    const cleanLocation = cleanTextForICS(
      ev.location || (ev.format === 'online' ? 'Online VIP' : 'A definir'),
    )
    const cleanDesc = cleanTextForICS(descParts.join('\n'))

    lines.push('BEGIN:VEVENT')
    lines.push(`UID:${uid}`)
    lines.push(`DTSTAMP:${nowICS}`)
    lines.push(`DTSTART:${dtStart}`)
    lines.push(`DTEND:${dtEnd}`)
    lines.push(`SUMMARY:${cleanSummary}`)
    if (cleanLocation) lines.push(`LOCATION:${cleanLocation}`)
    if (cleanDesc) lines.push(`DESCRIPTION:${cleanDesc}`)
    if (ev.contactLink) lines.push(`URL:${ev.contactLink}`)
    lines.push('STATUS:CONFIRMED')
    lines.push('END:VEVENT')
  })

  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}

export function downloadICSFile(
  events: CalendarExportEvent[],
  filename = 'edvanced-business-club-agenda.ics',
) {
  if (events.length === 0) {
    throw new Error('Nenhum evento para exportar no momento.')
  }
  const icsContent = generateICSContent(events)
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
