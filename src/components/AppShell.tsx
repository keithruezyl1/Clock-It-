import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { Home, BarChart3, User, WifiOff } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

const tabs = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/stats', label: 'Stats', icon: BarChart3, end: false },
  { to: '/profile', label: 'Profile', icon: User, end: false },
]

function useOnline() {
  const [online, setOnline] = useState(navigator.onLine)
  useEffect(() => {
    const up = () => setOnline(true)
    const down = () => setOnline(false)
    window.addEventListener('online', up)
    window.addEventListener('offline', down)
    return () => {
      window.removeEventListener('online', up)
      window.removeEventListener('offline', down)
    }
  }, [])
  return online
}

export function AppShell() {
  const online = useOnline()
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col">
      <AnimatePresence>
        {!online && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="flex items-center justify-center gap-2 bg-peach-100 py-2 text-[13px] font-bold text-peach-500 safe-top">
              <WifiOff size={15} /> You’re offline — changes won’t save.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
      <main className="flex-1 pb-28">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md px-6 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="glass flex items-center justify-around rounded-3xl px-2 py-2 shadow-soft">
          {tabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end}
              className="relative flex min-h-[44px] flex-1 flex-col items-center gap-0.5 rounded-2xl py-2 text-xs font-bold"
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="tab-pill"
                      className="absolute inset-0 rounded-2xl bg-lavender-100"
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    />
                  )}
                  <t.icon
                    size={22}
                    className={`relative z-10 ${isActive ? 'text-lavender-600' : 'text-lavender-300'}`}
                  />
                  <span
                    className={`relative z-10 ${isActive ? 'text-lavender-600' : 'text-lavender-300'}`}
                  >
                    {t.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
