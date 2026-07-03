import { addDays, differenceInCalendarDays, format, parseISO, subDays } from 'date-fns'
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

export interface Streaks {
  current: number
  best: number
}

/** Consecutive worked days. Today not being worked (yet) doesn't break the current streak. */
export function streaks(logs: AttendanceLog[]): Streaks {
  const dates = [...new Set(logs.filter((l) => l.clock_in_at).map((l) => l.work_date))].sort()
  let best = 0
  let run = 0
  let prev: string | null = null
  for (const d of dates) {
    run = prev && differenceInCalendarDays(parseISO(d), parseISO(prev)) === 1 ? run + 1 : 1
    if (run > best) best = run
    prev = d
  }
  const worked = new Set(dates)
  let cursor = new Date()
  if (!worked.has(todayDateStr(cursor))) cursor = subDays(cursor, 1)
  let current = 0
  while (worked.has(todayDateStr(cursor))) {
    current++
    cursor = subDays(cursor, 1)
  }
  return { current, best }
}

export interface WorkRecords {
  longestDayMinutes: number
  longestDayDate: string | null
  /** ISO timestamp of the earliest-in-the-day clock-in ever. */
  earliestClockIn: string | null
  /** Most common clock-in hour (0–23). */
  commonClockInHour: number | null
}

export function records(logs: AttendanceLog[]): WorkRecords {
  let longest = 0
  let longestDate: string | null = null
  let earliest: string | null = null
  let earliestMins = Infinity
  const hourCounts = new Map<number, number>()
  for (const l of logs) {
    const m = logMinutes(l)
    if (m > longest) {
      longest = m
      longestDate = l.work_date
    }
    if (l.clock_in_at) {
      const dt = parseISO(l.clock_in_at)
      const mins = dt.getHours() * 60 + dt.getMinutes()
      if (mins < earliestMins) {
        earliestMins = mins
        earliest = l.clock_in_at
      }
      hourCounts.set(dt.getHours(), (hourCounts.get(dt.getHours()) ?? 0) + 1)
    }
  }
  let commonHour: number | null = null
  let commonCount = 0
  for (const [hour, count] of hourCounts) {
    if (count > commonCount || (count === commonCount && commonHour != null && hour < commonHour)) {
      commonHour = hour
      commonCount = count
    }
  }
  return {
    longestDayMinutes: Math.round(longest),
    longestDayDate: longestDate,
    earliestClockIn: earliest,
    commonClockInHour: commonHour,
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
