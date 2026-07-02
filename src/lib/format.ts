import { format, isToday, isYesterday, parseISO, differenceInSeconds } from 'date-fns'

export function fmtTime(iso: string | null): string {
  if (!iso) return '--:--'
  return format(parseISO(iso), 'h:mm a')
}

export function fmtDateLong(iso: string): string {
  const d = parseISO(iso)
  if (isToday(d)) return 'Today'
  if (isYesterday(d)) return 'Yesterday'
  return format(d, 'EEEE, MMM d')
}

export function fmtDateShort(iso: string): string {
  return format(parseISO(iso), 'MMM d, yyyy')
}

/** Duration between two ISO timestamps, human readable e.g. "7h 32m". */
export function fmtDuration(start: string | null, end: string | null): string {
  if (!start) return '—'
  const from = parseISO(start)
  const to = end ? parseISO(end) : new Date()
  const secs = Math.max(0, differenceInSeconds(to, from))
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  if (h === 0 && m === 0) return `${secs}s`
  return `${h > 0 ? `${h}h ` : ''}${m}m`
}
