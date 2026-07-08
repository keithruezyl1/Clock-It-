import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FullScreenLoader } from '../components/Spinner'
import { supabase } from '../lib/supabase'

export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    // detectSessionInUrl handles the exchange; wait for the session then route home.
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) navigate('/', { replace: true })
    })
    // Fallback in case the event already fired.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate('/', { replace: true })
    })
    const t = setTimeout(() => navigate('/auth', { replace: true }), 6000)
    return () => {
      sub.subscription.unsubscribe()
      clearTimeout(t)
    }
  }, [navigate])

  return <FullScreenLoader label="Signing you in…" />
}
