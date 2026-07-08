import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from './supabase'
import { todayDateStr } from './format'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'
import type { AttendanceLog } from './types'

const UNDO_WINDOW_MS = 5000
/** Skip foreground/reconnect refetches when the data is this fresh. */
const REFRESH_MIN_INTERVAL_MS = 15_000

interface LogsContextValue {
  logs: AttendanceLog[]
  loading: boolean
  error: string | null
  /** Local calendar day, kept fresh across midnight while the app is open. */
  today: string
  refresh: () => Promise<void>
  /** Optimistic local update without a refetch. */
  mutate: (fn: (logs: AttendanceLog[]) => AttendanceLog[]) => void
  /** Optimistic delete with a 5s Undo toast; commits to Supabase after. */
  deleteLog: (log: AttendanceLog) => void
  /** Stale-session prompts the user dismissed this app session. */
  dismissedStale: string[]
  dismissStale: (id: string) => void
}

const LogsContext = createContext<LogsContextValue | null>(null)

/** Single shared store of attendance logs for the whole app. */
export function LogsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const toast = useToast()
  const [logs, setLogs] = useState<AttendanceLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [today, setToday] = useState(todayDateStr())
  const [dismissedStale, setDismissedStale] = useState<string[]>([])

  const logsRef = useRef(logs)
  logsRef.current = logs
  const lastFetchRef = useRef(0)
  // Deletes inside their undo window: already removed from state, not yet
  // committed to Supabase. refresh() must not resurrect them.
  const pendingDeletes = useRef(new Map<string, { log: AttendanceLog; index: number; timer: number }>())

  const refresh = useCallback(async () => {
    if (!user) {
      setLogs([])
      setLoading(false)
      return
    }
    lastFetchRef.current = Date.now()
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
      setLogs((data ?? []).filter((row) => !pendingDeletes.current.has(row.id)))
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

  // Fresh data when the PWA is brought back to the foreground or reconnects.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return
      if (Date.now() - lastFetchRef.current < REFRESH_MIN_INTERVAL_MS) return
      void refresh()
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('online', onVisible)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('online', onVisible)
    }
  }, [refresh])

  const mutate = useCallback((fn: (logs: AttendanceLog[]) => AttendanceLog[]) => {
    setLogs(fn)
  }, [])

  const restoreLog = useCallback((log: AttendanceLog, index: number) => {
    setLogs((l) => {
      if (l.some((x) => x.id === log.id)) return l
      const i = Math.min(Math.max(index, 0), l.length)
      return [...l.slice(0, i), log, ...l.slice(i)]
    })
  }, [])

  const commitDelete = useCallback(
    async (id: string) => {
      const entry = pendingDeletes.current.get(id)
      if (!entry) return
      pendingDeletes.current.delete(id)
      // Also drop any copy a refetch may have brought back meanwhile.
      setLogs((l) => l.filter((x) => x.id !== id))
      const { error: err } = await supabase.from('attendance_logs').delete().eq('id', id)
      if (err) {
        toast('error', `Couldn’t delete the log: ${err.message}`)
        restoreLog(entry.log, entry.index)
      }
    },
    [restoreLog, toast],
  )

  const deleteLog = useCallback(
    (log: AttendanceLog) => {
      if (pendingDeletes.current.has(log.id)) return
      const index = Math.max(0, logsRef.current.findIndex((l) => l.id === log.id))
      // Timer slightly outlasts the toast so a last-instant Undo still lands.
      const timer = window.setTimeout(() => void commitDelete(log.id), UNDO_WINDOW_MS + 400)
      pendingDeletes.current.set(log.id, { log, index, timer })
      setLogs((l) => l.filter((x) => x.id !== log.id))
      toast('info', 'Log deleted.', {
        duration: UNDO_WINDOW_MS,
        actionLabel: 'Undo',
        onAction: () => {
          const entry = pendingDeletes.current.get(log.id)
          if (!entry) return
          clearTimeout(entry.timer)
          pendingDeletes.current.delete(log.id)
          restoreLog(entry.log, entry.index)
        },
      })
    },
    [commitDelete, restoreLog, toast],
  )

  const dismissStale = useCallback((id: string) => {
    setDismissedStale((d) => (d.includes(id) ? d : [...d, id]))
  }, [])

  return (
    <LogsContext.Provider
      value={{ logs, loading, error, today, refresh, mutate, deleteLog, dismissedStale, dismissStale }}
    >
      {children}
    </LogsContext.Provider>
  )
}

export function useLogs() {
  const ctx = useContext(LogsContext)
  if (!ctx) throw new Error('useLogs must be used within LogsProvider')
  return ctx
}
