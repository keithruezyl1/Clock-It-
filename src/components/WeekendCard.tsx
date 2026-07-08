import { motion } from 'framer-motion'
import { Mascot } from './illustrations/Mascot'

// Ten weekend greetings. One is chosen per calendar day — stable through the
// day, varying day to day (and Saturday vs Sunday get different picks).
const WEEKEND_MESSAGES = [
  'No clocking in today — the weekend is all yours. 🌴',
  'OJT’s on pause. Kick back and enjoy your day off! 😎',
  'Weekends are for resting, not logging. Soak it up! ☀️',
  'Happy weekend! Your hours can wait until Monday. 🎉',
  'The clock’s off duty — go do something fun. 🍿',
  'Rest up, you’ve earned it. See you Monday! 💤',
  'Step away from the app and enjoy every minute. 🌈',
  'Weekend mode: on. Recharge those batteries. 🔋',
  'No work logs today — just good vibes and free time. ✨',
  'Treat yourself today. The clock will be here Monday. 🌞',
]

// Same daily-hash approach as the weekday greeting, keyed so the pick is
// stable for a given date but differs across days.
function weekendMessage(dateStr: string): string {
  const key = `weekend:${dateStr}`
  let hash = 0
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) | 0
  return WEEKEND_MESSAGES[Math.abs(hash) % WEEKEND_MESSAGES.length]
}

/** Shown in place of the clock-in card on weekends. */
export function WeekendCard({ dateStr }: { dateStr: string }) {
  return (
    <motion.div
      initial={{ scale: 0.97, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="relative overflow-hidden rounded-4xl bg-gradient-to-br from-sky-400 to-lavender-500 p-6 text-white shadow-soft"
    >
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
      <div className="absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-white/10" />
      <div className="relative flex items-center gap-4">
        <Mascot mood="happy" className="h-16 w-16 shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-bold uppercase tracking-wide text-white/80">Weekend</p>
          <p className="mt-1 text-2xl font-black leading-tight">Enjoy your day off!</p>
        </div>
      </div>
      <p className="relative mt-4 rounded-2xl bg-white/20 p-3 text-center text-[14px] font-semibold">
        {weekendMessage(dateStr)}
      </p>
    </motion.div>
  )
}
