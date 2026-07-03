import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { addWeeks, endOfWeek, format, isSameWeek, setHours, startOfDay, startOfWeek } from 'date-fns'
import { ChevronLeft, ChevronRight, Flame, Trophy, Sunrise, Clock, CalendarDays, BarChart3 } from 'lucide-react'
import { Page } from '../components/Page'
import { useLogs } from '../lib/useLogs'
import { minutesPerDay, monthTotals, records, streaks } from '../lib/stats'
import { fmtDateShort, fmtTime, todayDateStr } from '../lib/format'

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

function fmtHours(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  if (h === 0) return `${m}m`
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

export default function Stats() {
  const { logs, loading } = useLogs()
  const [weekOffset, setWeekOffset] = useState(0)

  const weekStart = useMemo(
    () => startOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 1 }),
    [weekOffset],
  )
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
  const perDay = useMemo(() => minutesPerDay(logs, weekStart), [logs, weekStart])
  const weekTotal = perDay.reduce((a, b) => a + b, 0)
  const maxDay = Math.max(...perDay)
  const isCurrentWeek = isSameWeek(new Date(), weekStart, { weekStartsOn: 1 })
  const todayStr = todayDateStr()

  const month = useMemo(() => monthTotals(logs, new Date()), [logs])
  const streak = useMemo(() => streaks(logs), [logs])
  const recs = useMemo(() => records(logs), [logs])

  return (
    <Page className="px-5 safe-top">
      <header className="py-6">
        <h1 className="text-2xl font-black text-lavender-700">Stats</h1>
      </header>

      {/* Week chart */}
      <div className="card p-5">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setWeekOffset((w) => w - 1)}
            className="grid h-9 w-9 place-items-center rounded-2xl bg-lavender-100 text-lavender-600 active:scale-95 transition"
            aria-label="Previous week"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="text-center">
            <p className="font-extrabold text-lavender-700">
              {isCurrentWeek ? 'This week' : `${format(weekStart, 'MMM d')} – ${format(weekEnd, 'MMM d')}`}
            </p>
            <p className="text-[12px] font-bold text-lavender-400">{fmtHours(weekTotal)} logged</p>
          </div>
          <button
            onClick={() => setWeekOffset((w) => w + 1)}
            disabled={isCurrentWeek}
            className="grid h-9 w-9 place-items-center rounded-2xl bg-lavender-100 text-lavender-600 active:scale-95 transition disabled:opacity-40"
            aria-label="Next week"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="mt-5 flex items-end justify-between gap-2">
          {perDay.map((min, i) => {
            const pct = maxDay > 0 ? Math.max(4, (min / maxDay) * 100) : 0
            const dayStr = todayDateStr(new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i))
            const isToday = dayStr === todayStr
            return (
              <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                <span className="h-4 text-[10px] font-bold text-lavender-400">
                  {min > 0 ? (min / 60).toFixed(min % 60 === 0 ? 0 : 1) : ''}
                </span>
                <div className="flex h-28 w-full items-end overflow-hidden rounded-xl bg-lavender-100/60">
                  <motion.div
                    className={`w-full rounded-xl ${isToday ? 'bg-lavender-500' : 'bg-lavender-300'}`}
                    initial={{ height: 0 }}
                    animate={{ height: `${pct}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut', delay: i * 0.04 }}
                  />
                </div>
                <span
                  className={`text-[11px] font-bold ${isToday ? 'text-lavender-600' : 'text-lavender-400'}`}
                >
                  {DAY_LABELS[i]}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Month summary */}
      <div className="card mt-4 p-5">
        <div className="flex items-center gap-2">
          <CalendarDays size={16} className="text-lavender-400" />
          <p className="font-extrabold text-lavender-700">{format(new Date(), 'MMMM')}</p>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-xl font-black text-lavender-700">{fmtHours(month.totalMinutes)}</p>
            <p className="text-[11px] font-semibold text-lavender-700/60">Total</p>
          </div>
          <div>
            <p className="text-xl font-black text-lavender-700">{month.daysWorked}</p>
            <p className="text-[11px] font-semibold text-lavender-700/60">Days worked</p>
          </div>
          <div>
            <p className="text-xl font-black text-lavender-700">
              {month.daysWorked ? fmtHours(month.avgMinutesPerWorkedDay) : '—'}
            </p>
            <p className="text-[11px] font-semibold text-lavender-700/60">Avg / day</p>
          </div>
        </div>
      </div>

      {/* Streak */}
      <div className="card mt-4 flex items-center gap-4 p-5">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-peach-400 to-peach-500 text-white">
          <Flame size={24} />
        </div>
        <div className="flex-1">
          <p className="text-xl font-black text-lavender-700">
            {streak.current} day{streak.current === 1 ? '' : 's'}
          </p>
          <p className="text-[13px] font-semibold text-lavender-700/60">Current streak</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-black text-lavender-700">{streak.best}</p>
          <p className="text-[13px] font-semibold text-lavender-700/60">Best</p>
        </div>
      </div>

      {/* Records */}
      <div className="card mt-4 mb-4 p-5">
        <div className="flex items-center gap-2">
          <Trophy size={16} className="text-lavender-400" />
          <p className="font-extrabold text-lavender-700">Records</p>
        </div>
        {logs.length === 0 && !loading ? (
          <p className="mt-3 text-[13px] text-lavender-700/60">
            Your records will show up once you start logging days.
          </p>
        ) : (
          <div className="mt-3 space-y-3">
            <RecordRow
              icon={<Clock size={16} />}
              label="Longest day"
              value={
                recs.longestDayMinutes > 0
                  ? `${fmtHours(recs.longestDayMinutes)}${recs.longestDayDate ? ` · ${fmtDateShort(recs.longestDayDate)}` : ''}`
                  : '—'
              }
            />
            <RecordRow
              icon={<Sunrise size={16} />}
              label="Earliest clock-in"
              value={recs.earliestClockIn ? fmtTime(recs.earliestClockIn) : '—'}
            />
            <RecordRow
              icon={<BarChart3 size={16} />}
              label="Usual start time"
              value={
                recs.commonClockInHour != null
                  ? format(setHours(startOfDay(new Date()), recs.commonClockInHour), 'h a')
                  : '—'
              }
            />
          </div>
        )}
      </div>
    </Page>
  )
}

function RecordRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-lavender-100 text-lavender-500">
        {icon}
      </div>
      <p className="flex-1 text-[13px] font-semibold text-lavender-700/60">{label}</p>
      <p className="text-[14px] font-extrabold text-lavender-700">{value}</p>
    </div>
  )
}
