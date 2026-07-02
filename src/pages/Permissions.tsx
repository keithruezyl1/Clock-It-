import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Bell, MapPin, Camera, Images, Check, ChevronRight } from 'lucide-react'
import { Page } from '../components/Page'
import { Logo, Wordmark } from '../components/Logo'
import { Spinner } from '../components/Spinner'
import { markPermsSeen } from '../App'
import {
  requestNotifications,
  requestLocation,
  requestCamera,
  requestPhotos,
  type PermState,
} from '../lib/permissions'

interface PermItem {
  key: string
  icon: typeof Bell
  title: string
  desc: string
  run: () => Promise<PermState>
  color: string
}

const items: PermItem[] = [
  {
    key: 'notifications',
    icon: Bell,
    title: 'Notifications',
    desc: 'Gentle reminders to clock in and out.',
    run: requestNotifications,
    color: 'from-lavender-400 to-lavender-600',
  },
  {
    key: 'location',
    icon: MapPin,
    title: 'Location',
    desc: 'Confirms you’re at your workplace when you clock in.',
    run: requestLocation,
    color: 'from-mint-400 to-mint-500',
  },
  {
    key: 'camera',
    icon: Camera,
    title: 'Camera',
    desc: 'Snap a photo to attach to your daily log.',
    run: requestCamera,
    color: 'from-peach-400 to-peach-500',
  },
  {
    key: 'photos',
    icon: Images,
    title: 'Photos',
    desc: 'Attach an existing photo from your gallery.',
    run: requestPhotos,
    color: 'from-sky-400 to-sky-500',
  },
]

export default function Permissions() {
  const navigate = useNavigate()
  const [states, setStates] = useState<Record<string, PermState | 'loading'>>({})
  const [busy, setBusy] = useState(false)

  const ask = async (item: PermItem) => {
    setStates((s) => ({ ...s, [item.key]: 'loading' }))
    const res = await item.run()
    setStates((s) => ({ ...s, [item.key]: res }))
  }

  const askAll = async () => {
    setBusy(true)
    for (const item of items) {
      // Sequential so each native prompt appears one at a time.
      // eslint-disable-next-line no-await-in-loop
      await ask(item)
    }
    setBusy(false)
  }

  const finish = () => {
    markPermsSeen()
    navigate('/auth', { replace: true })
  }

  return (
    <Page className="mx-auto flex min-h-screen max-w-md flex-col px-6 pb-10 safe-top">
      <div className="flex flex-1 flex-col justify-center py-8">
        <div className="mb-8 flex flex-col items-center text-center">
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 18 }}
          >
            <Logo size="lg" />
          </motion.div>
          <h1 className="mt-5 text-3xl font-black text-lavender-700">
            Welcome to <Wordmark className="text-3xl" />
          </h1>
          <p className="mt-2 text-[15px] leading-relaxed text-lavender-700/70">
            To track your OJT time smoothly, Clock It! needs a few permissions. You can allow them
            all now.
          </p>
        </div>

        <div className="space-y-3">
          {items.map((item, i) => {
            const state = states[item.key]
            return (
              <motion.button
                key={item.key}
                type="button"
                onClick={() => ask(item)}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.08 * i }}
                className="card flex w-full items-center gap-4 p-4 text-left active:scale-[0.98] transition"
              >
                <div
                  className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${item.color} text-white`}
                >
                  <item.icon size={22} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-extrabold text-lavender-700">{item.title}</p>
                  <p className="text-[13px] leading-snug text-lavender-700/60">{item.desc}</p>
                </div>
                <StatusChip state={state} />
              </motion.button>
            )
          })}
        </div>
      </div>

      <div className="space-y-3">
        <button className="btn-primary w-full" onClick={askAll} disabled={busy}>
          {busy ? <Spinner size={18} /> : <Bell size={18} />}
          Allow all permissions
        </button>
        <button className="btn-ghost w-full" onClick={finish} disabled={busy}>
          Continue <ChevronRight size={18} />
        </button>
        <p className="text-center text-xs text-lavender-700/50">
          You can change these anytime in your device settings.
        </p>
      </div>
    </Page>
  )
}

function StatusChip({ state }: { state?: PermState | 'loading' }) {
  if (state === 'loading') return <Spinner size={18} className="text-lavender-400" />
  if (state === 'granted')
    return (
      <span className="grid h-8 w-8 place-items-center rounded-full bg-mint-100 text-mint-500">
        <Check size={18} />
      </span>
    )
  if (state === 'denied')
    return <span className="text-xs font-bold text-peach-500">Denied</span>
  if (state === 'unsupported')
    return <span className="text-[11px] font-semibold text-lavender-300">N/A</span>
  return <ChevronRight size={18} className="text-lavender-300" />
}
