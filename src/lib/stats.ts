import { addDays, format, subDays } from 'date-fns'
import { todayDateStr } from './format'
import type { AttendanceLog } from './types'

/** Completed minutes of a single log (0 while still active). */
export function logMinutes(log: AttendanceLog): number {
  if (!log.clock_in_at || !log.clock_out_at) return 0
  return Math.max(
    0,
    (new Date(log.clock_out_at).getTime() - new Date(log.clock_in_at).getTime()) / 60000,
  )
}

export function totalMinutes(logs: AttendanceLog[]): number {
  return Math.round(logs.reduce((sum, l) => sum + logMinutes(l), 0))
}

/** Minutes per day for the 7 days starting at weekStart (Mon..Sun). */
export function minutesPerDay(logs: AttendanceLog[], weekStart: Date): number[] {
  const days = Array.from({ length: 7 }, (_, i) => todayDateStr(addDays(weekStart, i)))
  const byDay = new Map(days.map((d) => [d, 0]))
  for (const l of logs) {
    const cur = byDay.get(l.work_date)
    if (cur != null) byDay.set(l.work_date, cur + logMinutes(l))
  }
  return days.map((d) => Math.round(byDay.get(d) ?? 0))
}

export interface MonthTotals {
  totalMinutes: number
  daysWorked: number
  avgMinutesPerWorkedDay: number
}

export function monthTotals(logs: AttendanceLog[], month: Date): MonthTotals {
  const key = format(month, 'yyyy-MM')
  const monthLogs = logs.filter((l) => l.work_date.startsWith(key))
  const total = totalMinutes(monthLogs)
  const daysWorked = new Set(monthLogs.filter((l) => logMinutes(l) > 0).map((l) => l.work_date)).size
  return {
    totalMinutes: total,
    daysWorked,
    avgMinutesPerWorkedDay: daysWorked ? Math.round(total / daysWorked) : 0,
  }
}

/**
 * Average minutes per worked day over the last N days (completed logs only).
 * Returns null when nothing was worked in the window.
 */
export function avgDayMinutes(logs: AttendanceLog[], lastNDays = 30): number | null {
  const cutoff = todayDateStr(subDays(new Date(), lastNDays))
  const recent = logs.filter((l) => l.work_date >= cutoff && logMinutes(l) > 0)
  if (recent.length === 0) return null
  const days = new Set(recent.map((l) => l.work_date)).size
  return Math.round(totalMinutes(recent) / days)
}
