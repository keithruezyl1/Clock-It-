import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  /** Hide the close (X) button — use for required confirmations. */
  hideClose?: boolean
}

export function Modal({ open, onClose, title, children, hideClose }: ModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-backdrop/25 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-md card p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] rounded-b-none sm:rounded-b-3xl sm:mb-0 max-h-[90vh] overflow-y-auto no-scrollbar"
            initial={{ y: 60, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 360, damping: 30 }}
          >
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-lavender-200 sm:hidden" />
            {(title || !hideClose) && (
              <div className="mb-4 flex items-center justify-between">
                {title && <h2 className="text-xl font-extrabold text-lavender-700">{title}</h2>}
                {!hideClose && (
                  <button
                    onClick={onClose}
                    className="ml-auto grid h-9 w-9 place-items-center rounded-full bg-lavender-100 text-lavender-600 hover:bg-lavender-200"
                    aria-label="Close"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            )}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
