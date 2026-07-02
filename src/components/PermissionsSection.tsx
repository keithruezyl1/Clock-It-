import { useCallback, useEffect, useState } from 'react'
import { Bell, MapPin, Camera, Images, Check } from 'lucide-react'
import { Spinner } from './Spinner'
import { useToast } from './Toast'
import {
  queryPermission,
  requestNotifications,
  requestLocation,
  requestCamera,
  requestPhotos,
  type PermissionKey,
  type PermState,
} from '../lib/permissions'

interface Row {
  key: PermissionKey
  icon: typeof Bell
  title: string
  desc: string
  request: () => Promise<PermState>
  color: string
}

const ROWS: Row[] = [
  {
    key: 'notifications',
    icon: Bell,
    title: 'Notifications',
    desc: 'Gentle reminders to clock in and out.',
    request: requestNotifications,
    color: 'from-lavender-400 to-lavender-600',
  },
  {
    key: 'location',
    icon: MapPin,
    title: 'Location',
    desc: 'Confirms you’re at your workplace when you clock in.',
    request: requestLocation,
    color: 'from-mint-400 to-mint-500',
  },
  {
    key: 'camera',
    icon: Camera,
    title: 'Camera',
    desc: 'Snap a photo to attach to your daily log.',
    request: requestCamera,
    color: 'from-peach-400 to-peach-500',
  },
  {
    key: 'photos',
    icon: Images,
    title: 'Photos',
    desc: 'Attach an existing photo from your gallery.',
    request: requestPhotos,
    color: 'from-sky-400 to-sky-500',
  },
]

/**
 * A settings panel that lets the user grant any permission they skipped during
 * onboarding. Reflects each permission's live state and, where the browser has
 * already blocked one, points them to their device/browser settings (browsers
 * won't re-prompt once a permission is denied).
 */
export function PermissionsSection() {
  const toast = useToast()
  const [states, setStates] = useState<Record<string, PermState | 'loading'>>({})

  const refresh = useCallback(async () => {
    const entries = await Promise.all(
      ROWS.map(async (r) => [r.key, await queryPermission(r.key)] as const),
    )
    setStates(Object.fromEntries(entries))
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  // Keep chips live if the user flips a permission in their browser settings.
  useEffect(() => {
    if (!('permissions' in navigator)) return
    const cleanups: Array<() => void> = []
    ;(async () => {
      for (const r of ROWS) {
        if (r.key === 'notifications' || r.key === 'photos') continue
        try {
          const name = r.key === 'location' ? 'geolocation' : r.key
          const status = await navigator.permissions.query({ name: name as PermissionName })
          const handler = () => setStates((s) => ({ ...s, [r.key]: status.state as PermState }))
          status.addEventListener('change', handler)
          cleanups.push(() => status.removeEventListener('change', handler))
        } catch {
          /* permission not queryable in this browser — ignore */
        }
      }
    })()
    return () => cleanups.forEach((fn) => fn())
  }, [])

  const allow = async (row: Row) => {
    const current = states[row.key]
    if (current === 'granted' || current === 'loading' || current === 'unsupported') return
    if (current === 'denied') {
      toast(
        'info',
        `${row.title} is blocked. Enable it in your browser or device settings, then reopen this page.`,
      )
      return
    }
    setStates((s) => ({ ...s, [row.key]: 'loading' }))
    const res = await row.request()
    setStates((s) => ({ ...s, [row.key]: res }))
    if (res === 'granted') toast('success', `${row.title} enabled.`)
    else if (res === 'denied')
      toast('info', `${row.title} was blocked. You can enable it in your browser settings.`)
  }

  return (
    <div className="space-y-3">
      {ROWS.map((row) => {
        const state = states[row.key]
        return (
          <button
            key={row.key}
            type="button"
            onClick={() => allow(row)}
            className="card flex w-full items-center gap-4 p-4 text-left active:scale-[0.99] transition"
          >
            <div
              className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${row.color} text-white`}
            >
              <row.icon size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-extrabold text-lavender-700">{row.title}</p>
              <p className="text-[13px] leading-snug text-lavender-700/60">{row.desc}</p>
            </div>
            <PermChip state={state} />
          </button>
        )
      })}
    </div>
  )
}

function PermChip({ state }: { state?: PermState | 'loading' }) {
  if (state === 'loading') return <Spinner size={18} className="text-lavender-400" />
  if (state === 'granted')
    return (
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-mint-100 text-mint-500">
        <Check size={18} />
      </span>
    )
  if (state === 'denied')
    return <span className="shrink-0 text-xs font-bold text-peach-500">Blocked</span>
  if (state === 'unsupported')
    return <span className="shrink-0 text-[11px] font-semibold text-lavender-300">N/A</span>
  // 'prompt' or not-yet-loaded
  return <span className="shrink-0 text-xs font-bold text-lavender-500">Allow</span>
}
