import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

type ToastKind = 'success' | 'error' | 'info'
interface Toast {
  id: number
  kind: ToastKind
  message: string
}

const ToastCtx = createContext<(kind: ToastKind, message: string) => void>(() => {})

const styles: Record<ToastKind, { bg: string; icon: ReactNode }> = {
  success: { bg: 'from-mint-400 to-mint-500', icon: <CheckCircle2 size={20} /> },
  error: { bg: 'from-peach-400 to-peach-500', icon: <AlertCircle size={20} /> },
  info: { bg: 'from-sky-400 to-sky-500', icon: <Info size={20} /> },
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  let seq = 0

  const push = useCallback((kind: ToastKind, message: string) => {
    const id = Date.now() + seq++
    setToasts((t) => [...t, { id, kind, message }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800)
  }, [])

  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="fixed inset-x-0 top-0 z-[100] flex flex-col items-center gap-2 px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -24, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              className={`flex w-full max-w-sm items-center gap-3 rounded-2xl bg-gradient-to-br ${styles[t.kind].bg} px-4 py-3 text-white shadow-soft`}
            >
              <span className="shrink-0">{styles[t.kind].icon}</span>
              <p className="flex-1 text-sm font-semibold leading-snug">{t.message}</p>
              <button
                onClick={() => setToasts((s) => s.filter((x) => x.id !== t.id))}
                className="shrink-0 opacity-70 hover:opacity-100"
                aria-label="Dismiss"
              >
                <X size={16} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  return useContext(ToastCtx)
}
