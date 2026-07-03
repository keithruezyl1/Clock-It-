import { useEffect, useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { AlarmClockOff, LogOut } from 'lucide-react'
import { Modal } from './Modal'
import { Spinner } from './Spinner'
import { useToast } from './Toast'
import { supabase } from '../lib/supabase'
import { fmtTime } from '../lib/format'
import type { AttendanceLog } from '../lib/types'

const MAX_SHIFT_MINUTES = 16 * 60

/**
 * Closes an `active` log left over from a previous day by picking a plausible
 * end time on that same day.
 */
export function StaleSessionModal({
  log,
  suggestedMinutes,
  onClose,
  onSaved,
}: {
  log: AttendanceLog | null
  /** Typical day length used for the default end time (minutes). */
  suggestedMinutes: number | null
  onClose: () => void
  onSaved: () => Promise<void> | void
}) {
  const toast = useToast()
  const [time, setTime] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  // The end time must land on the log's own work_date, after clock-in,
  // and within a sane maximum shift length.
  const limits = useMemo(() => {
    if (!log?.clock_in_at) return null
    const clockIn = parseISO(log.clock_in_at)
    const endOfDay = new Date(clockIn)
    endOfDay.setHours(23, 59, 0, 0)
    const capped = new Date(
      Math.min(clockIn.getTime() + MAX_SHIFT_MINUTES * 60_000, endOfDay.getTime()),
    )
    const min = new Date(clockIn.getTime() + 60_000)
    return { clockIn, min, max: capped }
  }, [log?.clock_in_at])

  useEffect(() => {
    if (!log || !limits) return
    const fallback = 8 * 60
    const suggested = new Date(
      limits.clockIn.getTime() + (suggestedMinutes ?? fallback) * 60_000,
    )
    const def = new Date(Math.min(Math.max(suggested.getTime(), limits.min.getTime()), limits.max.getTime()))
    setTime(format(def, 'HH:mm'))
    setNote('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [log?.id])

  const endDate = useMemo(() => {
    if (!log || !limits || !/^\d{2}:\d{2}$/.test(time)) return null
    const [h, m] = time.split(':').map(Number)
    const d = new Date(limits.clockIn)
    d.setHours(h, m, 0, 0)
    if (d < limits.min || d > limits.max) return null
    return d
  }, [log, limits, time])

  const save = async () => {
    if (!log || !endDate) return
    setSaving(true)
    const trimmed = note.trim()
    const { error } = await supabase
      .from('attendance_logs')
      .update({
        clock_out_at: endDate.toISOString(),
        status: 'completed',
        clock_out_notes: trimmed ? `${trimmed} (closed manually)` : '(closed manually)',
      })
      .eq('id', log.id)
    setSaving(false)
    if (error) {
      toast('error', error.message)
      return
    }
    toast('success', 'Session closed.')
    await onSaved()
    onClose()
  }

  if (!log || !limits) return null

  return (
    <Modal open={!!log} onClose={onClose} title="Forgot to clock out?">
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-2xl bg-peach-100 p-4">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-peach-400 to-peach-500 text-white">
            <AlarmClockOff size={22} />
          </div>
          <p className="text-[14px] leading-snug text-lavender-700/80">
            Looks like you forgot to clock out on{' '}
            <span className="font-extrabold text-lavender-700">
              {format(parseISO(log.work_date), 'EEE, MMM d')}
            </span>
            . Pick when you finished that day.
          </p>
        </div>

        <div>
          <label className="label">End time (clocked in at {fmtTime(log.clock_in_at)})</label>
          <input
            type="time"
            className="input"
            value={time}
            min={format(limits.min, 'HH:mm')}
            max={format(limits.max, 'HH:mm')}
            onChange={(e) => setTime(e.target.value)}
          />
          {!endDate && time !== '' && (
            <p className="mt-1 ml-1 text-[12px] font-semibold text-peach-500">
              Pick a time between {fmtTime(limits.min.toISOString())} and{' '}
              {fmtTime(limits.max.toISOString())}.
            </p>
          )}
        </div>

        <div>
          <label className="label">
            Note <span className="font-normal text-lavender-300">(optional)</span>
          </label>
          <textarea
            className="input min-h-[80px] resize-none"
            placeholder="What did you work on that day?"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={800}
          />
        </div>

        <button className="btn-primary w-full" onClick={save} disabled={!endDate || saving}>
          {saving ? <Spinner size={18} /> : <LogOut size={18} />} Close session
        </button>
      </div>
    </Modal>
  )
}
