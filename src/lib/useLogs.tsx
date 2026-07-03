import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'
import { todayDateStr } from './format'
import { useAuth } from '../context/AuthContext'
import type { AttendanceLog } from './types'

interface LogsContextValue {
  logs: AttendanceLog[]
  loading: boolean
  error: string | null
  /** Local calendar day, kept fresh across midnight while the app is open. */
  today: string
  refresh: () => Promise<void>
  /** Optimistic local update (e.g. delete/restore) without a refetch. */
  mutate: (fn: (logs: AttendanceLog[]) => AttendanceLog[]) => void
}

const LogsContext = createContext<LogsContextValue | null>(null)

/** Single shared fetch of attendance logs for Dashboard, Stats, and Profile. */
export function LogsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [logs, setLogs] = useState<AttendanceLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [today, setToday] = useState(todayDateStr())

  const refresh = useCallback(async () => {
    if (!user) return
    const { data, error } = await supabase
      .from('attendance_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('clock_in_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
    if (error) {
      setError(error.message)
    } else {
      setError(null)
      setLogs(data ?? [])
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    setLoading(true)
    void refresh()
  }, [refresh])

  useEffect(() => {
    const t = setInterval(() => {
      const d = todayDateStr()
      setToday((prev) => (prev === d ? prev : d))
    }, 30000)
    return () => clearInterval(t)
  }, [])

  const mutate = useCallback((fn: (logs: AttendanceLog[]) => AttendanceLog[]) => {
    setLogs(fn)
  }, [])

  return (
    <LogsContext.Provider value={{ logs, loading, error, today, refresh, mutate }}>
      {children}
    </LogsContext.Provider>
  )
}

export function useLogs() {
  const ctx = useContext(LogsContext)
  if (!ctx) throw new Error('useLogs must be used within LogsProvider')
  return ctx
}
