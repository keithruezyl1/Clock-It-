import { NavLink, Outlet } from 'react-router-dom'
import { Home, User } from 'lucide-react'
import { motion } from 'framer-motion'

const tabs = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/profile', label: 'Profile', icon: User, end: false },
]

export function AppShell() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col">
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
              className="relative flex flex-1 flex-col items-center gap-0.5 rounded-2xl py-2 text-xs font-bold"
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
