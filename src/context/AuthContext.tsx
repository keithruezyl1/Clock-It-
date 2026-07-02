import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Profile, WorkLocation } from '../lib/types'

interface AuthState {
  session: Session | null
  user: User | null
  profile: Profile | null
  workLocation: WorkLocation | null
  loading: boolean
  refreshProfile: () => Promise<void>
  refreshWorkLocation: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthCtx = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [workLocation, setWorkLocation] = useState<WorkLocation | null>(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
    setProfile(data ?? null)
  }, [])

  const loadWorkLocation = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('work_locations')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    setWorkLocation(data ?? null)
  }, [])

  const hydrate = useCallback(
    async (s: Session | null) => {
      setSession(s)
      if (s?.user) {
        await Promise.all([loadProfile(s.user.id), loadWorkLocation(s.user.id)])
      } else {
        setProfile(null)
        setWorkLocation(null)
      }
      setLoading(false)
    },
    [loadProfile, loadWorkLocation],
  )

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => hydrate(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      hydrate(s)
    })
    return () => sub.subscription.unsubscribe()
  }, [hydrate])

  const refreshProfile = useCallback(async () => {
    if (session?.user) await loadProfile(session.user.id)
  }, [session, loadProfile])

  const refreshWorkLocation = useCallback(async () => {
    if (session?.user) await loadWorkLocation(session.user.id)
  }, [session, loadWorkLocation])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setProfile(null)
    setWorkLocation(null)
  }, [])

  return (
    <AuthCtx.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        workLocation,
        loading,
        refreshProfile,
        refreshWorkLocation,
        signOut,
      }}
    >
      {children}
    </AuthCtx.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
