import { motion, AnimatePresence } from 'framer-motion'
import { PartyPopper } from 'lucide-react'

const CONFETTI = [
  { x: -120, y: -40, c: 'bg-lavender-400', d: 0 },
  { x: 120, y: -30, c: 'bg-mint-400', d: 0.05 },
  { x: -90, y: 60, c: 'bg-peach-400', d: 0.1 },
  { x: 100, y: 70, c: 'bg-sky-400', d: 0.15 },
  { x: -140, y: 30, c: 'bg-mint-500', d: 0.08 },
  { x: 140, y: 20, c: 'bg-lavender-500', d: 0.12 },
  { x: -40, y: -80, c: 'bg-peach-500', d: 0.03 },
  { x: 40, y: -80, c: 'bg-sky-500', d: 0.18 },
]

/** A one-time celebration shown when the user completes their OJT target. */
export function CelebrationModal({
  open,
  hours,
  onClose,
}: {
  open: boolean
  hours: number
  onClose: () => void
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center bg-backdrop/40 p-6 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
            className="relative w-full max-w-sm overflow-hidden rounded-4xl bg-surface p-7 text-center shadow-soft"
          >
            {/* confetti burst */}
            <div className="pointer-events-none absolute left-1/2 top-16">
              {CONFETTI.map((p, i) => (
                <motion.span
                  key={i}
                  className={`absolute h-2.5 w-2.5 rounded-sm ${p.c}`}
                  initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
                  animate={{ x: p.x, y: p.y, opacity: [0, 1, 1, 0], scale: 1, rotate: 220 }}
                  transition={{ duration: 1.1, delay: p.d, ease: 'easeOut' }}
                />
              ))}
            </div>

            <motion.div
              initial={{ rotate: -12 }}
              animate={{ rotate: [-12, 12, -8, 8, 0] }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-lavender-400 to-lavender-600 text-white shadow-soft"
            >
              <PartyPopper size={40} />
            </motion.div>

            <h2 className="mt-5 text-2xl font-black text-lavender-700">OJT complete! 🎉</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-lavender-700/70">
              You’ve logged all <span className="font-bold text-lavender-700">{hours} hours</span> of
              your on-the-job training. Incredible work — you did it!
            </p>

            <button className="btn-primary mt-6 w-full" onClick={onClose}>
              Celebrate 🎊
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
