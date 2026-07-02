import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LogIn,
  LogOut,
  CalendarDays,
  Clock,
  ChevronRight,
  Coffee,
  Trash2,
  Timer,
} from 'lucide-react'
import { Page } from '../components/Page'
import { Wordmark } from '../components/Logo'
import { Spinner } from '../components/Spinner'
import { LogDetailModal } from '../components/LogDetailModal'
import { ConfirmModal } from '../components/ConfirmModal'
import { CelebrationModal } from '../components/CelebrationModal'
import { useToast } from '../components/Toast'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import type { AttendanceLog } from '../lib/types'
import { fmtTime, fmtDateLong, fmtDuration, todayDateStr } from '../lib/format'

// A mix of motivating, warm, and playful greetings shown on the idle card.
const WELCOME_MESSAGES = [
  'Today’s a fresh chance to do great work.',
  'Small steps today, big wins later.',
  'You’ve got everything it takes for today.',
  'Show up, clock in, make it count.',
  'Progress starts the moment you clock in.',
  'One clock-in closer to your goals.',
  'Make today a day worth logging.',
  'Glad to have you here today.',
  'Take a breath — you’ve got this.',
  'Here’s to a good, steady day.',
  'Hope today treats you kindly.',
  'Ease in — one clock-in at a time.',
  'Your future self will thank you for today.',
  'Another day, another chance to shine.',
  'Time to make the clock earn its keep.',
  'Coffee first, then conquer the day. ☕',
  'The clock’s been waiting for you. 👀',
  'Let’s turn “good morning” into “good work”.',
  'Warning: greatness may occur today.',
  'Tap the button, become a legend, repeat tomorrow.',
]

// Pick one greeting per calendar day — stable all day, varies day to day.
function dailyWelcome(date = new Date()) {
  const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
  let hash = 0
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) | 0
  return WELCOME_MESSAGES[Math.abs(hash) % WELCOME_MESSAGES.length]
}

export default function Dashboard() {
  const navigate = useNavigate()
  const toast = useToast()
  const { user, profile } = useAuth()
  const [logs, setLogs] = useState<AttendanceLog[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<AttendanceLog | null>(null)
  const [toDelete, setToDelete] = useState<AttendanceLog | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Track the local calendar day so the UI rolls over at midnight even if the
  // app is left open — yesterday's session then counts as yesterday, not today.
  const [today, setToday] = useState(todayDateStr())
  useEffect(() => {
    const t = setInterval(() => {
      const d = todayDateStr()
      setToday((prev) => (prev === d ? prev : d))
    }, 30000)
    return () => clearInterval(t)
  }, [])

  const load = async () => {
    if (!user) return
    const { data, error } = await supabase
      .from('attendance_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('clock_in_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
    if (error) toast('error', error.message)
    setLogs(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // Only today's session drives the "clocked in" hero. An open session from a
  // previous day stays in history dated to its own day; it no longer counts as
  // an active session today.
  const activeLog = useMemo(
    () =>
      logs.find((l) => l.work_date === today && l.status === 'active' && !l.clock_out_at) ?? null,
    [logs, today],
  )
  const todayCompleted = useMemo(
    () => logs.find((l) => l.work_date === today && l.status === 'completed') ?? null,
    [logs, today],
  )

  // Total logged minutes across all completed (clocked-out) sessions.
  const totalMinutes = useMemo(() => {
    let m = 0
    for (const l of logs) {
      if (l.clock_in_at && l.clock_out_at) {
        m += (new Date(l.clock_out_at).getTime() - new Date(l.clock_in_at).getTime()) / 60000
      }
    }
    return Math.round(m)
  }, [logs])

  const targetHours = profile?.ojt_target_hours ?? null

  // Fire the completion celebration once, when the target is first reached.
  const [celebrate, setCelebrate] = useState(false)
  useEffect(() => {
    if (loading || !user || !targetHours) return
    if (totalMinutes < targetHours * 60) return
    const key = `ojt-celebrated:${user.id}:${targetHours}`
    if (typeof localStorage !== 'undefined' && !localStorage.getItem(key)) {
      localStorage.setItem(key, '1')
      setCelebrate(true)
    }
  }, [loading, user, targetHours, totalMinutes])

  const confirmDelete = async () => {
    if (!toDelete) return
    setDeleting(true)
    const { error } = await supabase.from('attendance_logs').delete().eq('id', toDelete.id)
    setDeleting(false)
    if (error) {
      toast('error', error.message)
      return
    }
    toast('success', 'Log deleted.')
    setLogs((l) => l.filter((x) => x.id !== toDelete.id))
    setToDelete(null)
    setSelected(null)
  }

  return (
    <Page className="px-5 safe-top">
      <header className="flex items-center justify-between py-6">
        <div>
          <h1 className="text-2xl font-black text-lavender-700">
            <Wordmark className="text-2xl" />
          </h1>
        </div>
        <div className="flex items-center gap-1.5 rounded-2xl bg-white/70 px-3 py-2 text-xs font-bold text-lavender-500 shadow-card">
          <CalendarDays size={15} />
          {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </div>
      </header>

      {/* Status hero */}
      {loading ? (
        <div className="grid h-44 place-items-center card">
          <Spinner size={26} className="text-lavender-400" />
        </div>
      ) : activeLog ? (
        <ActiveCard log={activeLog} onClockOut={() => navigate('/clock-out')} />
      ) : todayCompleted ? (
        <DoneCard log={todayCompleted} />
      ) : (
        <IdleCard onClockIn={() => navigate('/clock-in')} />
      )}

      {/* Total hours */}
      {!loading && <TotalHoursCard minutes={totalMinutes} targetHours={targetHours} />}

      {/* History */}
      <div className="mb-3 mt-8 flex items-center justify-between">
        <h2 className="text-lg font-extrabold text-lavender-700">Your daily logs</h2>
        <span className="text-xs font-bold text-lavender-400">{logs.length} total</span>
      </div>

      {loading ? null : logs.length === 0 ? (
        <div className="card flex flex-col items-center gap-2 py-12 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-3xl bg-lavender-100 text-lavender-400">
            <Coffee size={26} />
          </div>
          <p className="font-bold text-lavender-600">No logs yet</p>
          <p className="px-8 text-[13px] text-lavender-700/60">
            Clock in for the day to create your first log.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5 pb-4">
          {logs.map((log, i) => (
            <motion.button
              key={log.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.3) }}
              onClick={() => setSelected(log)}
              className="card flex w-full items-center gap-3 p-4 text-left active:scale-[0.985] transition"
            >
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-lavender-100 text-lavender-600">
                <Clock size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-extrabold text-lavender-700">
                    {fmtDateLong(log.work_date)}
                  </p>
                  {log.status === 'active' && (
                    <span className="rounded-full bg-mint-100 px-2 py-0.5 text-[10px] font-bold text-mint-500">
                      ACTIVE
                    </span>
                  )}
                </div>
                <p className="truncate text-[13px] text-lavender-700/60">
                  {log.title || 'Daily log'}
                </p>
              </div>
              <div className="text-right">
                <p className="flex items-center justify-end gap-1 text-[13px] font-bold text-lavender-600">
                  <LogIn size={13} className="text-mint-500" /> {fmtTime(log.clock_in_at)}
                </p>
                <p className="flex items-center justify-end gap-1 text-[13px] font-bold text-lavender-600">
                  <LogOut size={13} className="text-peach-400" />{' '}
                  {log.clock_out_at ? fmtTime(log.clock_out_at) : '—'}
                </p>
              </div>
              <ChevronRight size={18} className="shrink-0 text-lavender-300" />
            </motion.button>
          ))}
        </div>
      )}

      <LogDetailModal
        log={selected}
        onClose={() => setSelected(null)}
        onDelete={(l) => setToDelete(l)}
      />
      <ConfirmModal
        open={!!toDelete}
        title="Delete this log?"
        icon={<Trash2 size={26} />}
        tone="danger"
        confirmLabel="Delete"
        loading={deleting}
        message="This will permanently remove the log and its details. This can’t be undone."
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
      <CelebrationModal
        open={celebrate}
        hours={targetHours ?? 0}
        onClose={() => setCelebrate(false)}
      />
    </Page>
  )
}

function TotalHoursCard({
  minutes,
  targetHours,
}: {
  minutes: number
  targetHours: number | null
}) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  const targetMin = targetHours ? targetHours * 60 : null
  const done = targetMin != null && minutes >= targetMin
  const remainingH = targetMin != null ? Math.ceil(Math.max(0, targetMin - minutes) / 60) : null
  const pct = targetMin ? Math.min(100, Math.round((minutes / targetMin) * 100)) : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 rounded-4xl bg-gradient-to-br from-mint-400 to-mint-500 p-5 text-white shadow-soft"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-white/80">
            Total hours logged
          </p>
          <p className="mt-1 text-3xl font-black tabular-nums">
            {h}h {m}m
          </p>
        </div>
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/20">
          <Timer size={24} />
        </div>
      </div>

      {targetMin != null && (
        <div className="mt-4">
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/25">
            <motion.div
              className="h-full rounded-full bg-white"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
          <p className="mt-2 text-sm font-semibold text-white/95">
            {done
              ? '🎉 OJT complete — you did it!'
              : `${remainingH} hour${remainingH === 1 ? '' : 's'} to go!`}
          </p>
        </div>
      )}
    </motion.div>
  )
}

/* ---- status cards ---- */

function ActiveCard({ log, onClockOut }: { log: AttendanceLog; onClockOut: () => void }) {
  const [, setTick] = useState(0)
  useEffect(() => {
    // Tick every second so the elapsed timer stays live.
    const t = setInterval(() => setTick((n) => n + 1), 1000)
    return () => clearInterval(t)
  }, [])
  return (
    <motion.div
      initial={{ scale: 0.97, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="relative overflow-hidden rounded-4xl bg-gradient-to-br from-mint-400 to-mint-500 p-6 text-white shadow-soft"
    >
      <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/15" />
      <p className="text-sm font-bold uppercase tracking-wide text-white/80">Clocked in</p>
      <p className="mt-1 text-4xl font-black tabular-nums">
        {fmtDuration(log.clock_in_at, null)}
      </p>
      <p className="mt-1 text-sm text-white/85">Since {fmtTime(log.clock_in_at)} · {log.title || 'Working'}</p>
      <button
        onClick={onClockOut}
        className="btn mt-5 w-full bg-white text-mint-500 shadow-card hover:brightness-105"
      >
        <LogOut size={18} /> Clock out for the day
      </button>
    </motion.div>
  )
}

function IdleCard({ onClockIn }: { onClockIn: () => void }) {
  return (
    <motion.div
      initial={{ scale: 0.97, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="relative overflow-hidden rounded-4xl bg-gradient-to-br from-lavender-500 to-lavender-600 p-6 text-white shadow-soft"
    >
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
      <div className="absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-white/10" />
      <p className="text-2xl font-black">Start your work day</p>
      <p className="mt-1 text-sm text-white/85">{dailyWelcome()}</p>
      <button
        onClick={onClockIn}
        className="btn mt-5 w-full bg-white text-lavender-700 shadow-card hover:brightness-105"
      >
        <LogIn size={18} /> Clock in for the day
      </button>
    </motion.div>
  )
}

function DoneCard({ log }: { log: AttendanceLog }) {
  return (
    <motion.div
      initial={{ scale: 0.97, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="card p-6"
    >
      <p className="text-sm font-bold uppercase tracking-wide text-lavender-400">Today · done</p>
      <p className="mt-1 text-2xl font-black text-lavender-700">
        {fmtDuration(log.clock_in_at, log.clock_out_at)} logged
      </p>
      <div className="mt-2 flex gap-4 text-sm font-semibold text-lavender-600">
        <span className="flex items-center gap-1">
          <LogIn size={15} className="text-mint-500" /> {fmtTime(log.clock_in_at)}
        </span>
        <span className="flex items-center gap-1">
          <LogOut size={15} className="text-peach-400" /> {fmtTime(log.clock_out_at)}
        </span>
      </div>
      <p className="mt-5 rounded-2xl bg-lavender-50 p-3 text-center text-[13px] font-semibold text-lavender-600">
        That’s your log for today — see you tomorrow! 🌙
      </p>
    </motion.div>
  )
}
