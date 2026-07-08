export type ThemeId = 'lavender' | 'mint' | 'peach' | 'sky' | 'slate'
export type ThemeMode = 'light' | 'dark' | 'system'

export interface ThemePreset {
  id: ThemeId
  label: string
  /** Swatch color shown in the theme picker. */
  swatch: string
  /** <meta name="theme-color"> value per resolved mode. */
  meta: { light: string; dark: string }
}

/**
 * Preset metadata only — the actual CSS variable values live in
 * src/index.css under [data-theme] / [data-mode="dark"] blocks so the
 * first paint needs no JS beyond the boot script in index.html.
 */
export const THEMES: ThemePreset[] = [
  { id: 'lavender', label: 'Lavender', swatch: '#a78bfa', meta: { light: '#a78bfa', dark: '#262138' } },
  { id: 'mint', label: 'Mint', swatch: '#34d399', meta: { light: '#34d399', dark: '#1d2a24' } },
  { id: 'peach', label: 'Peach', swatch: '#fb8c66', meta: { light: '#fb8c66', dark: '#312520' } },
  { id: 'sky', label: 'Sky', swatch: '#5aa6ff', meta: { light: '#5aa6ff', dark: '#1c2534' } },
  { id: 'slate', label: 'Slate', swatch: '#64748b', meta: { light: '#64748b', dark: '#21252d' } },
]

export const DEFAULT_THEME: ThemeId = 'lavender'
export const DEFAULT_MODE: ThemeMode = 'light'
export const THEME_STORAGE_KEY = 'clockit_theme_v1'

export function isThemeId(v: unknown): v is ThemeId {
  return typeof v === 'string' && THEMES.some((t) => t.id === v)
}

export function isThemeMode(v: unknown): v is ThemeMode {
  return v === 'light' || v === 'dark' || v === 'system'
}
