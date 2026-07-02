import { createClient } from '@supabase/supabase-js'

// The publishable key is safe to ship in the client bundle; env vars override it.
const url =
  (import.meta.env.VITE_SUPABASE_URL as string) || 'https://fgvxnpmvxhakygkmffxv.supabase.co'
const anonKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ||
  'sb_publishable_3pgCWylXHTz_5ecQkTW96w_NutqCot5'

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
})

export const PHOTO_BUCKET = 'attendance-photos'
