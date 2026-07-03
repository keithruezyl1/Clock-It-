import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  MapPin,
  ShieldCheck,
  ShieldAlert,
  RefreshCw,
  Clock,
  LogIn,
  Type,
  StickyNote,
  ImagePlus,
} from 'lucide-react'
import { Page } from '../components/Page'
import { Spinner } from '../components/Spinner'
import { PhotoPicker } from '../components/PhotoPicker'
import { ConfirmModal } from '../components/ConfirmModal'
import { useToast } from '../components/Toast'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { uploadPhoto } from '../lib/storage'
import { getCurrentPosition, distanceMeters, formatDistance, type Coords } from '../lib/geo'
import { todayDateStr } from '../lib/format'

type Phase = 'verifying' | 'verified' | 'too_far' | 'error'

export default function ClockIn() {
  const navigate = useNavigate()
  const toast = useToast()
  const { user, workLocation } = useAuth()

  const [phase, setPhase] = useState<Phase>('verifying')
  const [coords, setCoords] = useState<Coords | null>(null)
  const [distance, setDistance] = useState<number | null>(null)
  const [errMsg, setErrMsg] = useState('')

  const [now, setNow] = useState(new Date())
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [confirm, setConfirm] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const verify = async () => {
    if (!workLocation) {
      setPhase('error')
      setErrMsg('No workplace set. Please set one in your profile.')
      return
    }
    setPhase('verifying')
    try {
      const c = await getCurrentPosition()
      setCoords(c)
      const d = distanceMeters(c, {
        latitude: workLocation.latitude,
        longitude: workLocation.longitude,
      })
      setDistance(d)
      setPhase(d <= workLocation.radius_meters ? 'verified' : 'too_far')
    } catch (err) {
      setErrMsg((err as Error).message)
      setPhase('error')
    }
  }

  useEffect(() => {
    verify()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Only one log per day: if today's log already exists, don't allow another.
  useEffect(() => {
    if (!user) return
    supabase
      .from('attendance_logs')
      .select('id')
      .eq('user_id', user.id)
      .eq('work_date', todayDateStr())
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          toast('info', 'You already have a log for today.')
          navigate('/', { replace: true })
        }
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const save = async () => {
    if (!user || !coords) return
    setSaving(true)
    try {
      let photoUrl: string | null = null
      if (photo) photoUrl = await uploadPhoto(user.id, photo, 'clockin')
      const { error } = await supabase.from('attendance_logs').insert({
        user_id: user.id,
        work_location_id: workLocation?.id ?? null,
        work_date: todayDateStr(),
        clock_in_at: new Date().toISOString(),
        clock_in_lat: coords.latitude,
        clock_in_lng: coords.longitude,
        clock_in_distance_m: distance,
        title: title.trim() || 'Daily log',
        clock_in_notes: notes.trim() || null,
        clock_in_photo_url: photoUrl,
        status: 'active',
      })
      if (error) throw error
      toast('success', "You're clocked in! Have a great day.")
      navigate('/', { replace: true })
    } catch (err) {
      const e = err as { code?: string; message?: string }
      toast(
        'error',
        e.code === '23505' ? 'You already have a log for today.' : e.message || 'Could not clock in.',
      )
      setSaving(false)
      setConfirm(false)
    }
  }

  return (
    <Page className="mx-auto flex min-h-screen max-w-md flex-col px-5 pb-8 safe-top">
      <header className="flex items-center gap-3 py-5">
        <button
          onClick={() => navigate(-1)}
          className="grid h-10 w-10 place-items-center rounded-2xl bg-surface/70 text-lavender-600 shadow-card"
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-black text-lavender-700">Clock in</h1>
      </header>

      <AnimatePresence mode="wait">
        {phase !== 'verified' ? (
          <motion.div
            key="verify"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-1 flex-col items-center justify-center text-center"
          >
            <VerifyView
              phase={phase}
              distance={distance}
              radius={workLocation?.radius_meters ?? 10000}
              placeName={workLocation?.place_name || workLocation?.city || 'your workplace'}
              errMsg={errMsg}
              onRetry={verify}
            />
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1"
          >
            {/* verified banner */}
            <div className="mb-5 flex items-center gap-3 rounded-3xl bg-gradient-to-br from-mint-100 to-mint-200 p-4">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-mint-500 text-white">
                <ShieldCheck size={22} />
              </div>
              <div>
                <p className="font-extrabold text-mint-500">Location verified</p>
                <p className="text-[13px] text-lavender-700/70">
                  {distance != null ? `${formatDistance(distance)} from workplace` : 'At your workplace'}
                </p>
              </div>
            </div>

            {/* live clock */}
            <div className="mb-5 rounded-3xl bg-gradient-to-br from-lavender-500 to-lavender-600 p-5 text-center text-white shadow-soft">
              <p className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wide text-white/80">
                <Clock size={14} /> Clock-in time
              </p>
              <p className="mt-1 text-4xl font-black tabular-nums">
                {now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label flex items-center gap-1.5">
                  <Type size={14} /> Title
                </label>
                <input
                  className="input"
                  placeholder="e.g. Frontend tasks, QA testing…"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={80}
                  autoFocus
                />
              </div>
              <div>
                <label className="label flex items-center gap-1.5">
                  <StickyNote size={14} /> Notes / tasks for the day{' '}
                  <span className="font-normal text-lavender-300">(optional)</span>
                </label>
                <textarea
                  className="input min-h-[96px] resize-none"
                  placeholder="What are you planning to work on?"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  maxLength={800}
                />
              </div>
              <div>
                <label className="label flex items-center gap-1.5">
                  <ImagePlus size={14} /> Add a photo{' '}
                  <span className="font-normal text-lavender-300">(optional)</span>
                </label>
                <PhotoPicker file={photo} onChange={setPhoto} />
              </div>
            </div>

            <button
              className="btn-primary mt-6 w-full"
              onClick={() => setConfirm(true)}
              disabled={!title.trim()}
            >
              <LogIn size={18} /> Clock in now
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal
        open={confirm}
        title="Confirm clock-in?"
        icon={<LogIn size={26} />}
        confirmLabel="Yes, clock me in"
        loading={saving}
        message={
          <>
            Start your work day at{' '}
            <span className="font-bold text-lavender-700">
              {now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
            </span>
            ? Your location has been verified.
          </>
        }
        onConfirm={save}
        onCancel={() => setConfirm(false)}
      />
    </Page>
  )
}

function VerifyView({
  phase,
  distance,
  radius,
  placeName,
  errMsg,
  onRetry,
}: {
  phase: Phase
  distance: number | null
  radius: number
  placeName: string
  errMsg: string
  onRetry: () => void
}) {
  if (phase === 'verifying') {
    return (
      <>
        <div className="relative grid h-28 w-28 place-items-center">
          <motion.span
            className="absolute inset-0 rounded-full bg-lavender-200"
            animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <div className="grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-lavender-400 to-lavender-600 text-white shadow-soft">
            <MapPin size={32} />
          </div>
        </div>
        <p className="mt-6 text-xl font-black text-lavender-700">Checking your location…</p>
        <p className="mt-1 text-[15px] text-lavender-700/70">
          Making sure you’re at {placeName}.
        </p>
      </>
    )
  }
  if (phase === 'too_far') {
    return (
      <>
        <div className="grid h-24 w-24 place-items-center rounded-full bg-peach-100 text-peach-500">
          <ShieldAlert size={44} />
        </div>
        <p className="mt-6 text-xl font-black text-lavender-700">You’re too far away</p>
        <p className="mt-1 text-[15px] text-lavender-700/70">
          You’re{' '}
          <span className="font-bold text-peach-500">
            {distance != null ? formatDistance(distance) : ''}
          </span>{' '}
          from {placeName}. You need to be within {(radius / 1000).toFixed(0)} km to clock in.
        </p>
        <button className="btn-primary mt-6" onClick={onRetry}>
          <RefreshCw size={18} /> Check again
        </button>
      </>
    )
  }
  return (
    <>
      <div className="grid h-24 w-24 place-items-center rounded-full bg-peach-100 text-peach-500">
        <ShieldAlert size={44} />
      </div>
      <p className="mt-6 text-xl font-black text-lavender-700">Location check failed</p>
      <p className="mt-1 text-[15px] text-lavender-700/70">{errMsg}</p>
      <button className="btn-primary mt-6" onClick={onRetry}>
        <RefreshCw size={18} /> Try again
      </button>
    </>
  )
}
