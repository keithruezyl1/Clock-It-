import { useMemo, useState } from 'react'
import { Download } from 'lucide-react'
import {
  endOfMonth,
  endOfWeek,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { Modal } from './Modal'
import { Spinner } from './Spinner'
import { useToast } from './Toast'
import { useAuth } from '../context/AuthContext'
import { exportXlsx, totalHours } from '../lib/exportXlsx'
import { todayDateStr } from '../lib/format'
import type { AttendanceLog } from '../lib/types'

type RangeKey = 'week' | 'month' | 'all' | 'custom'

const RANGES: { key: RangeKey; label: string }[] = [
  { key: 'week', label: 'This week' },
  { key: 'month', label: 'This month' },
  { key: 'all', label: 'All time' },
  { key: 'custom', label: 'Custom' },
]

export function ExportModal({
  open,
  onClose,
  logs: allLogs,
}: {
  open: boolean
  onClose: () => void
  logs: AttendanceLog[]
}) {
  const toast = useToast()
  const { profile } = useAuth()
  const [range, setRange] = useState<RangeKey>('month')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [busy, setBusy] = useState(false)

  const bounds = useMemo((): { from: string; to: string; label: string } | null => {
    const now = new Date()
    if (range === 'week') {
      const from = todayDateStr(startOfWeek(now, { weekStartsOn: 1 }))
      const to = todayDateStr(endOfWeek(now, { weekStartsOn: 1 }))
      return { from, to, label: `This week (${from} – ${to})` }
    }
    if (range === 'month') {
      const from = todayDateStr(startOfMonth(now))
      const to = todayDateStr(endOfMonth(now))
      return { from, to, label: `This month (${from} – ${to})` }
    }
    if (range === 'all') {
      if (!allLogs.length) return { from: 'all', to: todayDateStr(), label: 'All time' }
      const dates = allLogs.map((l) => l.work_date).sort()
      return { from: dates[0], to: dates[dates.length - 1], label: 'All time' }
    }
    if (!customFrom || !customTo || customFrom > customTo) return null
    return { from: customFrom, to: customTo, label: `${customFrom} – ${customTo}` }
  }, [range, customFrom, customTo, allLogs])

  const filtered = useMemo(() => {
    if (!bounds) return []
    if (range === 'all') return allLogs
    return allLogs.filter((l) => l.work_date >= bounds.from && l.work_date <= bounds.to)
  }, [allLogs, bounds, range])

  const previewHours = totalHours(filtered)

  const download = async () => {
    if (!bounds) return
    setBusy(true)
    try {
      await exportXlsx({
        logs: filtered,
        name: profile?.full_name || 'Student',
        rangeLabel: bounds.label,
        from: bounds.from,
        to: bounds.to,
        targetHours: profile?.ojt_target_hours ?? null,
      })
      toast('success', 'Export downloaded.')
      onClose()
    } catch (err) {
      toast('error', (err as Error).message || 'Export failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Export hours">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`rounded-2xl border-2 px-3 py-2.5 text-sm font-bold transition ${
                range === r.key
                  ? 'border-lavender-400 bg-lavender-100 text-lavender-700'
                  : 'border-lavender-100 bg-surface/60 text-lavender-700/60'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {range === 'custom' && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label">From</label>
              <input
                type="date"
                className="input"
                value={customFrom}
                max={customTo || undefined}
                onChange={(e) => setCustomFrom(e.target.value)}
              />
            </div>
            <div>
              <label className="label">To</label>
              <input
                type="date"
                className="input"
                value={customTo}
                min={customFrom || undefined}
                onChange={(e) => setCustomTo(e.target.value)}
              />
            </div>
          </div>
        )}

        <p className="rounded-2xl bg-lavender-50 p-3 text-center text-[13px] font-semibold text-lavender-600">
          {!bounds ? (
            'Pick a valid date range.'
          ) : (
            <>
              {filtered.length} log{filtered.length === 1 ? '' : 's'} · {previewHours.toFixed(1)} h
            </>
          )}
        </p>

        <button
          className="btn-primary w-full"
          onClick={download}
          disabled={busy || !bounds || filtered.length === 0}
        >
          {busy ? <Spinner size={18} /> : <Download size={18} />} Download .xlsx
        </button>
      </div>
    </Modal>
  )
}
