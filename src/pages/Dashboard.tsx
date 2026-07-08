import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  LogIn,
  LogOut,
  CalendarDays,
  Clock,
  ChevronRight,
  MapPin,
  Timer,
  Download,
  RefreshCw,
} from 'lucide-react'
import { EmptyLogsIllustration } from '../components/illustrations/EmptyLogs'
import { Page } from '../components/Page'
import { Wordmark } from '../components/Logo'
import { Skeleton } from '../components/Skeleton'
import { LogDetailModal } from '../components/LogDetailModal'
import { CelebrationModal } from '../components/CelebrationModal'
import { ExportModal } from '../components/ExportModal'
import { StaleSessionModal } from '../components/StaleSessionModal'
import { WeekendCard } from '../components/WeekendCard'
import { useToast } from '../components/Toast'
import { useAuth } from '../context/AuthContext'
import { useLogs } from '../lib/useLogs'
import { avgDayMinutes, logMinutes, totalMinutes as sumMinutes } from '../lib/stats'
import { queryPermission } from '../lib/permissions'
import { getCurrentPosition, distanceMeters, formatDistance } from '../lib/geo'
import { MAX_SHIFT_HOURS } from '../lib/constants'
import type { AttendanceLog } from '../lib/types'
import { fmtTime, fmtDateLong, fmtDuration, isWeekend } from '../lib/format'
import { addDays, format } from 'date-fns'

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
  const { logs, loading, error, today, refresh, deleteLog, dismissedStale, dismissStale } =
    useLogs()
  const reduceMotion = useReducedMotion()
  const [selected, setSelected] = useState<AttendanceLog | null>(null)
  const [exportOpen, setExportOpen] = useState(false)

  // Sessions left open on a previous day — prompt to close them, one at a time.
  const [staleEdit, setStaleEdit] = useState<AttendanceLog | null>(null)
  const staleLogs = useMemo(
    () => logs.filter((l) => l.status === 'active' && l.work_date < today),
    [logs, today],
  )
  const stalePrompt =
    staleEdit ?? (loading ? null : staleLogs.find((l) => !dismissedStale.includes(l.id)) ?? null)
  const typicalDayMinutes = useMemo(() => avgDayMinutes(logs, 30), [logs])
  const completedCount = useMemo(() => logs.filter((l) => logMinutes(l) > 0).length, [logs])

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

  // Weekends are days off — no clocking in, just a friendly greeting.
  const weekend = isWeekend(today)

  // Total logged minutes across all completed (clocked-out) sessions.
  const totalMinutes = useMemo(() => sumMinutes(logs), [logs])

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

  // One-time milestone toasts at 25/50/75%, same key pattern as the celebration.
  useEffect(() => {
    if (loading || !user || !targetHours) return
    const pct = (totalMinutes / (targetHours * 60)) * 100
    const messages: Record<number, string> = {
      25: 'A quarter of the way through your OJT! 💪',
      50: 'Halfway there! 🎉',
      75: '75% done — home stretch! 🚀',
    }
    let announce: string | null = null
    for (const m of [25, 50, 75]) {
      if (pct < m) break
      // Always mark reached milestones (even at 100%+) so dropping back below
      // the target later can't fire a stale "75% done" toast.
      const key = `ojt-milestone:${user.id}:${targetHours}:${m}`
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, '1')
        announce = messages[m]
      }
    }
    if (announce && pct < 100) toast('success', announce)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user, targetHours, totalMinutes])

  const handleDelete = (log: AttendanceLog) => {
    setSelected(null)
    deleteLog(log)
  }

  return (
    <Page className="px-5 safe-top">
      <header className="flex items-center justify-between py-6">
        <div>
          <h1 className="text-2xl font-black text-lavender-700">
            <Wordmark className="text-2xl" />
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setExportOpen(true)}
            className="grid h-9 w-9 place-items-center rounded-2xl bg-surface/70 text-lavender-500 shadow-card active:scale-95 transition"
            aria-label="Export hours"
          >
            <Download size={16} />
          </button>
          <div className="flex items-center gap-1.5 rounded-2xl bg-surface/70 px-3 py-2 text-xs font-bold text-lavender-500 shadow-card">
            <CalendarDays size={15} />
            {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </div>
        </div>
      </header>

      {error && !loading && (
        <div className="card mb-4 flex items-center gap-3 p-4">
          <p className="flex-1 text-[13px] font-semibold text-lavender-700/70">
            Couldn’t load your logs.
          </p>
          <button className="btn-soft !px-4 !py-2 text-sm" onClick={() => void refresh()}>
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      )}

      {/* Status hero */}
      {loading ? (
        <>
          <Skeleton className="h-44 rounded-4xl" />
          <Skeleton className="mt-4 h-32 rounded-4xl" />
        </>
      ) : activeLog ? (
        <ActiveCard log={activeLog} onClockOut={() => navigate('/clock-out')} />
      ) : todayCompleted ? (
        <DoneCard log={todayCompleted} />
      ) : weekend ? (
        <WeekendCard dateStr={today} />
      ) : (
        <IdleCard onClockIn={() => navigate('/clock-in')} />
      )}

      {/* Total hours */}
      {!loading && (
        <TotalHoursCard
          minutes={totalMinutes}
          targetHours={targetHours}
          typicalDayMinutes={typicalDayMinutes}
          completedCount={completedCount}
        />
      )}

      {/* History */}
      <div className="mb-3 mt-8 flex items-center justify-between">
        <h2 className="text-lg font-extrabold text-lavender-700">Your daily logs</h2>
        <span className="text-xs font-bold text-lavender-400">{logs.length} total</span>
      </div>

      {loading ? (
        <div className="space-y-2.5 pb-4">
          <Skeleton className="h-[76px] rounded-3xl" />
          <Skeleton className="h-[76px] rounded-3xl" />
          <Skeleton className="h-[76px] rounded-3xl" />
        </div>
      ) : logs.length === 0 ? (
        <div className="card flex flex-col items-center gap-2 py-10 text-center">
          <EmptyLogsIllustration className="h-28 w-auto" />
          <p className="font-bold text-lavender-600">No logs yet</p>
          <p className="px-8 text-[13px] text-lavender-700/60">
            Clock in for the day to create your first log.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5 pb-4">
          <AnimatePresence initial={!reduceMotion}>
          {logs.map((log, i) => (
            <motion.button
              key={log.id}
              layout={!reduceMotion}
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, scale: 0.95 }}
              transition={{ delay: Math.min(i * 0.04, 0.3), layout: { delay: 0 } }}
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
          </AnimatePresence>
        </div>
      )}

      <LogDetailModal
        log={selected}
        onClose={() => setSelected(null)}
        onDelete={handleDelete}
        onCloseSession={(l) => {
          setSelected(null)
          setStaleEdit(l)
        }}
      />
      <CelebrationModal
        open={celebrate}
        hours={targetHours ?? 0}
        onClose={() => setCelebrate(false)}
      />
      <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} logs={logs} />
      <StaleSessionModal
        log={stalePrompt}
        suggestedMinutes={typicalDayMinutes}
        onClose={() => {
          if (stalePrompt && !staleEdit) dismissStale(stalePrompt.id)
          setStaleEdit(null)
        }}
        onSaved={refresh}
      />
    </Page>
  )
}

function TotalHoursCard({
  minutes,
  targetHours,
  typicalDayMinutes,
  completedCount,
}: {
  minutes: number
  targetHours: number | null
  typicalDayMinutes: number | null
  completedCount: number
}) {
  const targetMin = targetHours ? targetHours * 60 : null
  const done = targetMin != null && minutes >= targetMin
  const remainingH = targetMin != null ? Math.ceil(Math.max(0, targetMin - minutes) / 60) : null
  const pct = targetMin ? Math.min(100, Math.round((minutes / targetMin) * 100)) : null

  // Projected finish: remaining work at the recent per-worked-day pace.
  // Only shown once there's enough history to make it meaningful.
  const projection = useMemo(() => {
    if (targetMin == null || done) return null
    if (completedCount < 5 || !typicalDayMinutes || typicalDayMinutes <= 0) return null
    const daysNeeded = Math.ceil((targetMin - minutes) / typicalDayMinutes)
    return format(addDays(new Date(), daysNeeded), 'MMM d')
  }, [targetMin, minutes, done, typicalDayMinutes, completedCount])

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 rounded-4xl bg-gradient-to-br from-mint-400 to-mint-500 p-6 text-white shadow-soft"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-bold uppercase tracking-wide text-white/80">
            Total hours logged
          </p>
          <p className="mt-1 text-3xl font-black tabular-nums">
            {Math.floor(minutes / 60)}h {minutes % 60}m
          </p>
          {targetMin != null && (
            <p className="mt-1 text-sm font-semibold text-white/95">
              {done
                ? '🎉 OJT complete — you did it!'
                : `${remainingH} hour${remainingH === 1 ? '' : 's'} to go!`}
            </p>
          )}
          {projection && (
            <p className="mt-1.5 inline-block rounded-full bg-white/20 px-2.5 py-1 text-[12px] font-bold">
              On pace to finish ~{projection}
            </p>
          )}
        </div>
        {targetMin != null && pct != null ? (
          <ProgressRing pct={pct} />
        ) : (
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/20">
            <Timer size={24} />
          </div>
        )}
      </div>
    </motion.div>
  )
}

function ProgressRing({ pct, size = 96, stroke = 9 }: { pct: number; size?: number; stroke?: number }) {
  const reduceMotion = useReducedMotion()
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.25)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="white"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={reduceMotion ? false : { strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - pct / 100) }}
          transition={{ duration: reduceMotion ? 0 : 0.9, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className="text-lg font-black tabular-nums">{pct}%</span>
      </div>
    </div>
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
  const elapsedHours = log.clock_in_at
    ? (Date.now() - new Date(log.clock_in_at).getTime()) / 3_600_000
    : 0
  const overlong = elapsedHours > MAX_SHIFT_HOURS
  return (
    <motion.div
      initial={{ scale: 0.97, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="relative overflow-hidden rounded-4xl bg-gradient-to-br from-mint-400 to-mint-500 p-6 text-white shadow-soft"
    >
      <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/15" />
      <p className="text-sm font-bold uppercase tracking-wide text-white/80">Clocked in</p>
      {overlong ? (
        <p className="mt-1 text-2xl font-black">Still working? 👀</p>
      ) : (
        <p className="mt-1 text-4xl font-black tabular-nums">{fmtDuration(log.clock_in_at, null)}</p>
      )}
      <p className="mt-1 text-sm text-white/85">
        {overlong
          ? `This session has been open since ${fmtTime(log.clock_in_at)} — close it if you're done.`
          : `Since ${fmtTime(log.clock_in_at)} · ${log.title || 'Working'}`}
      </p>
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
  const { workLocation } = useAuth()

  // Distance-to-workplace hint, shown only if location permission is already
  // granted — never prompt from the dashboard.
  const [distanceHint, setDistanceHint] = useState<string | null>(null)
  useEffect(() => {
    let cancelled = false
    if (!workLocation) return
    queryPermission('location').then((state) => {
      if (state !== 'granted' || cancelled) return
      // Coarse, cached fix is plenty for a hint — don't spin up the GPS radio.
      getCurrentPosition({ enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 })
        .then((c) => {
          if (cancelled) return
          const d = distanceMeters(c, {
            latitude: workLocation.latitude,
            longitude: workLocation.longitude,
          })
          setDistanceHint(formatDistance(d))
        })
        .catch(() => {})
    })
    return () => {
      cancelled = true
    }
  }, [workLocation])

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
      {distanceHint && (
        <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-[12px] font-bold">
          <MapPin size={12} /> ~{distanceHint} from your workplace
        </p>
      )}
      <button
        onClick={onClockIn}
        className="btn mt-5 w-full bg-white text-lavender-600 shadow-card hover:brightness-105"
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
      className="relative overflow-hidden rounded-4xl bg-gradient-to-br from-sky-400 to-lavender-500 p-6 text-white shadow-soft"
    >
      <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/15" />
      <p className="text-sm font-bold uppercase tracking-wide text-white/80">Today · done</p>
      <p className="mt-1 text-2xl font-black">
        {fmtDuration(log.clock_in_at, log.clock_out_at)} logged
      </p>
      <div className="mt-2 flex gap-4 text-sm font-semibold text-white/90">
        <span className="flex items-center gap-1">
          <LogIn size={15} /> {fmtTime(log.clock_in_at)}
        </span>
        <span className="flex items-center gap-1">
          <LogOut size={15} /> {fmtTime(log.clock_out_at)}
        </span>
      </div>
      <p className="mt-5 rounded-2xl bg-white/20 p-3 text-center text-[13px] font-semibold text-white">
        That’s your log for today — see you tomorrow! 🌙
      </p>
    </motion.div>
  )
}
