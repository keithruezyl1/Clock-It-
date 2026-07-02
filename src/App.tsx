import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useAuth } from './context/AuthContext'
import { FullScreenLoader } from './components/Spinner'
import { AppShell } from './components/AppShell'

import Permissions from './pages/Permissions'
import Login from './pages/Login'
import AuthCallback from './pages/AuthCallback'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import ClockIn from './pages/ClockIn'
import ClockOut from './pages/ClockOut'
import Profile from './pages/Profile'

const PERMS_KEY = 'clockit_perms_v1'
export const permsSeen = () => localStorage.getItem(PERMS_KEY) === 'done'
export const markPermsSeen = () => localStorage.setItem(PERMS_KEY, 'done')

export default function App() {
  const { loading, session, profile } = useAuth()
  const location = useLocation()

  if (loading) return <FullScreenLoader label="Getting things ready…" />

  const authed = !!session
  const onboarded = !!profile?.onboarded

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* First-run permissions intro */}
        <Route
          path="/welcome"
          element={authed && onboarded ? <Navigate to="/" replace /> : <Permissions />}
        />

        {/* Auth */}
        <Route
          path="/auth"
          element={
            !authed ? (
              <Login />
            ) : onboarded ? (
              <Navigate to="/" replace />
            ) : (
              <Navigate to="/onboarding" replace />
            )
          }
        />

        {/* Onboarding (requires auth) */}
        <Route
          path="/onboarding"
          element={
            !authed ? (
              <Navigate to="/auth" replace />
            ) : onboarded ? (
              <Navigate to="/" replace />
            ) : (
              <Onboarding />
            )
          }
        />

        {/* Full-screen app flows (require auth + onboarding) */}
        <Route
          path="/clock-in"
          element={<Guard authed={authed} onboarded={onboarded}><ClockIn /></Guard>}
        />
        <Route
          path="/clock-out"
          element={<Guard authed={authed} onboarded={onboarded}><ClockOut /></Guard>}
        />

        {/* Tabbed app */}
        <Route element={<Guard authed={authed} onboarded={onboarded}><AppShell /></Guard>}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  )
}

function Guard({
  authed,
  onboarded,
  children,
}: {
  authed: boolean
  onboarded: boolean
  children: JSX.Element
}) {
  if (!authed) return <Navigate to={permsSeen() ? '/auth' : '/welcome'} replace />
  if (!onboarded) return <Navigate to="/onboarding" replace />
  return children
}
