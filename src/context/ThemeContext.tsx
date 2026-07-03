import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import {
  DEFAULT_MODE,
  DEFAULT_THEME,
  THEME_STORAGE_KEY,
  THEMES,
  isThemeId,
  isThemeMode,
  type ThemeId,
  type ThemeMode,
} from '../lib/themes'
import { useAuth } from './AuthContext'

interface ThemeContextValue {
  theme: ThemeId
  mode: ThemeMode
  /** `mode` with "system" resolved to what's currently active. */
  resolvedMode: 'light' | 'dark'
  setTheme: (theme: ThemeId) => void
  setMode: (mode: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function readStored(): { theme: ThemeId; mode: ThemeMode } {
  try {
    const raw = JSON.parse(localStorage.getItem(THEME_STORAGE_KEY) || '{}')
    return {
      theme: isThemeId(raw.theme) ? raw.theme : DEFAULT_THEME,
      mode: isThemeMode(raw.mode) ? raw.mode : DEFAULT_MODE,
    }
  } catch {
    return { theme: DEFAULT_THEME, mode: DEFAULT_MODE }
  }
}

function systemPrefersDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function resolveMode(mode: ThemeMode): 'light' | 'dark' {
  return mode === 'system' ? (systemPrefersDark() ? 'dark' : 'light') : mode
}

function applyToDocument(theme: ThemeId, resolved: 'light' | 'dark') {
  const el = document.documentElement
  el.dataset.theme = theme
  el.dataset.mode = resolved
  el.style.colorScheme = resolved
  const preset = THEMES.find((t) => t.id === theme) ?? THEMES[0]
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', preset.meta[resolved])
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth()
  const [{ theme, mode }, setState] = useState(readStored)
  const [resolvedMode, setResolvedMode] = useState<'light' | 'dark'>(() => resolveMode(readStored().mode))
  // Tracks which profile we've already hydrated from, so a remote preference
  // is adopted once per sign-in instead of fighting local changes.
  const hydratedProfileRef = useRef<string | null>(null)

  useEffect(() => {
    const resolved = resolveMode(mode)
    setResolvedMode(resolved)
    applyToDocument(theme, resolved)
    if (mode !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      const r = mq.matches ? 'dark' : 'light'
      setResolvedMode(r)
      applyToDocument(theme, r)
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [theme, mode])

  // Adopt the preference saved on the profile (cross-device persistence).
  useEffect(() => {
    if (!profile || hydratedProfileRef.current === profile.id) return
    hydratedProfileRef.current = profile.id
    const remoteTheme = isThemeId(profile.theme) ? profile.theme : null
    const remoteMode = isThemeMode(profile.theme_mode) ? profile.theme_mode : null
    if (!remoteTheme && !remoteMode) return
    setState((prev) => {
      const next = { theme: remoteTheme ?? prev.theme, mode: remoteMode ?? prev.mode }
      localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [profile])

  const persist = useCallback(
    (next: { theme: ThemeId; mode: ThemeMode }) => {
      setState(next)
      localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(next))
      if (user) {
        void supabase
          .from('profiles')
          .update({ theme: next.theme, theme_mode: next.mode })
          .eq('id', user.id)
          .then(({ error }) => {
            // Non-critical (localStorage still has it) but don't hide it entirely.
            if (error) console.warn('Theme preference not saved to profile:', error.message)
          })
      }
    },
    [user],
  )

  const setTheme = useCallback((t: ThemeId) => persist({ theme: t, mode }), [persist, mode])
  const setMode = useCallback((m: ThemeMode) => persist({ theme, mode: m }), [persist, theme])

  return (
    <ThemeContext.Provider value={{ theme, mode, resolvedMode, setTheme, setMode }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
