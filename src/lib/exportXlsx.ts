import { format, parseISO } from 'date-fns'
import type { AttendanceLog } from './types'

export interface ExportOptions {
  logs: AttendanceLog[]
  name: string
  rangeLabel: string
  /** YYYY-MM-DD bounds used for the filename. */
  from: string
  to: string
  targetHours: number | null
}

/** Read a `--c-primary-*` RGB triplet from the active theme as an ARGB hex. */
function themeArgb(varName: string, fallback: string): string {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
  const parts = raw.split(/\s+/).map(Number)
  if (parts.length !== 3 || parts.some(Number.isNaN)) return fallback
  return 'FF' + parts.map((n) => n.toString(16).padStart(2, '0')).join('').toUpperCase()
}

function durationHours(log: AttendanceLog): number | null {
  if (!log.clock_in_at || !log.clock_out_at) return null
  const ms = new Date(log.clock_out_at).getTime() - new Date(log.clock_in_at).getTime()
  return Math.round((ms / 3_600_000) * 100) / 100
}

/** Sum of completed hours in a set of logs (same math the sheet's SUM uses). */
export function totalHours(logs: AttendanceLog[]): number {
  return Math.round(logs.reduce((sum, l) => sum + (durationHours(l) ?? 0), 0) * 100) / 100
}

export async function exportXlsx({ logs, name, rangeLabel, from, to, targetHours }: ExportOptions) {
  // Loaded on demand so exceljs stays out of the main bundle.
  const ExcelJS = (await import('exceljs')).default

  const primary = themeArgb('--c-primary-500', 'FFA78BFA')
  const primaryTint = themeArgb('--c-primary-100', 'FFF3ECFF')

  const wb = new ExcelJS.Workbook()
  wb.creator = 'Clock It!'
  wb.created = new Date()
  const ws = wb.addWorksheet('OJT Hours', { views: [{ state: 'frozen', ySplit: 6 }] })

  ws.columns = [
    { key: 'date', width: 13 },
    { key: 'day', width: 11 },
    { key: 'title', width: 26 },
    { key: 'in', width: 11 },
    { key: 'out', width: 11 },
    { key: 'dur', width: 13 },
    { key: 'notesIn', width: 32 },
    { key: 'notesOut', width: 32 },
    { key: 'dist', width: 12 },
  ]

  // Title block
  ws.mergeCells('A1:I1')
  const title = ws.getCell('A1')
  title.value = 'Clock It! — OJT Hours'
  title.font = { bold: true, size: 16, color: { argb: primary } }
  ws.mergeCells('A2:I2')
  ws.getCell('A2').value = `Student: ${name}`
  ws.mergeCells('A3:I3')
  ws.getCell('A3').value = `Range: ${rangeLabel}`
  ws.mergeCells('A4:I4')
  ws.getCell('A4').value = `Exported: ${format(new Date(), 'MMM d, yyyy h:mm a')}`
  for (const r of [2, 3, 4]) ws.getRow(r).font = { size: 11 }

  // Header
  const header = ws.getRow(6)
  header.values = [
    'Date',
    'Day',
    'Title',
    'Clock in',
    'Clock out',
    'Duration (h)',
    'Notes (in)',
    'Notes (out)',
    'Distance (m)',
  ]
  header.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: primary } }
    cell.alignment = { vertical: 'middle' }
    cell.border = { bottom: { style: 'thin' } }
  })

  const sorted = [...logs].sort((a, b) => a.work_date.localeCompare(b.work_date))
  const firstDataRow = 7
  sorted.forEach((log, i) => {
    const d = parseISO(log.work_date)
    const dur = durationHours(log)
    const row = ws.addRow({
      date: format(d, 'MMM d, yyyy'),
      day: format(d, 'EEEE'),
      title: log.title ?? '',
      in: log.clock_in_at ? format(parseISO(log.clock_in_at), 'h:mm a') : '—',
      out: log.clock_out_at ? format(parseISO(log.clock_out_at), 'h:mm a') : '—',
      dur: dur ?? undefined,
      notesIn: log.clock_in_notes ?? '',
      notesOut: log.clock_out_notes ?? '',
      dist: log.clock_in_distance_m != null ? Math.round(log.clock_in_distance_m) : undefined,
    })
    row.getCell('dur').numFmt = '0.00'
    if (i % 2 === 1) {
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: primaryTint } }
      })
    }
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = { bottom: { style: 'hair' } }
      cell.alignment = { vertical: 'top', wrapText: true }
    })
  })

  // TOTAL row with a real SUM so the sheet stays honest when edited.
  const lastDataRow = firstDataRow + sorted.length - 1
  const totalRow = ws.addRow({ date: 'TOTAL' })
  const durCell = totalRow.getCell('dur')
  durCell.value =
    sorted.length > 0 ? { formula: `SUM(F${firstDataRow}:F${lastDataRow})`, result: totalHours(sorted) } : 0
  durCell.numFmt = '0.00'
  totalRow.font = { bold: true }
  totalRow.eachCell({ includeEmpty: true }, (cell) => {
    cell.border = { top: { style: 'thin' } }
  })

  // Summary block
  const total = totalHours(sorted)
  const summaryStart = totalRow.number + 2
  const summary: [string, string | number][] = [['Total hours', total]]
  if (targetHours != null && targetHours > 0) {
    summary.push(
      ['Target hours', targetHours],
      ['Remaining', Math.max(0, Math.round((targetHours - total) * 100) / 100)],
      ['% complete', `${Math.min(100, Math.round((total / targetHours) * 100))}%`],
    )
  }
  summary.forEach(([label, value], i) => {
    const r = ws.getRow(summaryStart + i)
    r.getCell(1).value = label
    r.getCell(1).font = { bold: true }
    r.getCell(2).value = value
    if (typeof value === 'number') r.getCell(2).numFmt = '0.00'
  })

  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const safeName = (name || 'Student').replace(/[^\p{L}\p{N}]+/gu, '') || 'Student'
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `ClockIt_${safeName}_${from}_${to}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}
