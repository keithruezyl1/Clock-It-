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
} from 'lucide-react'
import { Page } from '../components/Page'
import { Wordmark } from '../components/Logo'
import { Spinner } from '../components/Spinner'
import { LogDetailModal } from '../components/LogDetailModal'
import { ConfirmModal } from '../components/ConfirmModal'
import { useToast } from '../components/Toast'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import type { AttendanceLog } from '../lib/types'
import { fmtTime, fmtDateLong, fmtDuration } from '../lib/format'

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
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

  const activeLog = useMemo(
    () => logs.find((l) => l.status === 'active' && !l.clock_out_at) ?? null,
    [logs],
  )
  const todayCompleted = useMemo(
    () => logs.find((l) => l.work_date === todayStr() && l.status === 'completed') ?? null,
    [logs],
  )

  const firstName = (profile?.full_name || 'there').split(' ')[0]

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
          <p className="text-[15px] font-semibold text-lavender-700/60">Hi {firstName} 👋</p>
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
        <DoneCard log={todayCompleted} onClockIn={() => navigate('/clock-in')} />
      ) : (
        <IdleCard onClockIn={() => navigate('/clock-in')} />
      )}

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
    </Page>
  )
}

/* ---- status cards ---- */

function ActiveCard({ log, onClockOut }: { log: AttendanceLog; onClockOut: () => void }) {
  const [, setTick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 1000 * 30)
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
        className="btn mt-5 w-full bg-white text-mint-600 shadow-card hover:brightness-105"
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
      <p className="text-sm font-bold uppercase tracking-wide text-white/80">Ready when you are</p>
      <p className="mt-1 text-2xl font-black">Start your work day</p>
      <p className="mt-1 text-sm text-white/85">We’ll verify you’re at your workplace first.</p>
      <button
        onClick={onClockIn}
        className="btn mt-5 w-full bg-white text-lavender-700 shadow-card hover:brightness-105"
      >
        <LogIn size={18} /> Clock in for the day
      </button>
    </motion.div>
  )
}

function DoneCard({ log, onClockIn }: { log: AttendanceLog; onClockIn: () => void }) {
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
      <button onClick={onClockIn} className="btn-soft mt-5 w-full">
        <LogIn size={18} /> Clock in again
      </button>
    </motion.div>
  )
}
