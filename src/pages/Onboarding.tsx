import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Sparkles,
  MapPin,
  Crosshair,
  ChevronRight,
  ChevronLeft,
  Building2,
  Timer,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react'
import { Page } from '../components/Page'
import { Logo } from '../components/Logo'
import { Spinner } from '../components/Spinner'
import { ConfirmModal } from '../components/ConfirmModal'
import { useToast } from '../components/Toast'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { getCurrentPosition, reverseGeocode, type Coords, type ReverseGeocode } from '../lib/geo'
import { CLOCK_IN_RADIUS_METERS } from '../lib/constants'

const HOURS_PRESETS = [200, 300, 400, 500, 600]

export default function Onboarding() {
  const navigate = useNavigate()
  const toast = useToast()
  const { user, profile, refreshProfile, refreshWorkLocation } = useAuth()

  const [step, setStep] = useState(0)
  const [dir, setDir] = useState(1)
  const [name, setName] = useState(profile?.full_name ?? '')
  const [targetHours, setTargetHours] = useState<number | ''>(profile?.ojt_target_hours ?? 500)

  const [coords, setCoords] = useState<Coords | null>(null)
  const [geo, setGeo] = useState<ReverseGeocode | null>(null)
  const [locating, setLocating] = useState(false)
  const [confirmLoc, setConfirmLoc] = useState(false)
  const [saving, setSaving] = useState(false)

  const go = (next: number) => {
    setDir(next > step ? 1 : -1)
    setStep(next)
  }

  const detectLocation = async () => {
    setLocating(true)
    try {
      const c = await getCurrentPosition()
      setCoords(c)
      const g = await reverseGeocode(c)
      setGeo(g)
      setConfirmLoc(true)
    } catch (err) {
      toast('error', (err as Error).message)
    } finally {
      setLocating(false)
    }
  }

  const finish = async () => {
    if (!user || !coords) return
    setSaving(true)
    try {
      // Deactivate any prior locations, then insert the new active one.
      await supabase.from('work_locations').update({ is_active: false }).eq('user_id', user.id)
      const { error: locErr } = await supabase.from('work_locations').insert({
        user_id: user.id,
        label: 'Workplace',
        place_name: geo?.place_name ?? null,
        address: geo?.address ?? null,
        city: geo?.city ?? null,
        region: geo?.region ?? null,
        country: geo?.country ?? null,
        latitude: coords.latitude,
        longitude: coords.longitude,
        radius_meters: CLOCK_IN_RADIUS_METERS,
        is_active: true,
      })
      if (locErr) throw locErr

      const { error: profErr } = await supabase
        .from('profiles')
        .update({
          full_name: name.trim(),
          ojt_target_hours: typeof targetHours === 'number' ? targetHours : null,
          onboarded: true,
        })
        .eq('id', user.id)
      if (profErr) throw profErr

      await Promise.all([refreshProfile(), refreshWorkLocation()])
      toast('success', "You're all set! Let's clock in.")
      navigate('/', { replace: true })
    } catch (err) {
      toast('error', (err as Error).message || 'Could not save your setup.')
      setSaving(false)
    }
  }

  const steps = [
    <NameStep key="name" name={name} setName={setName} onNext={() => go(1)} />,
    <OjtHoursStep key="ojt" hours={targetHours} setHours={setTargetHours} />,
    <LocationStep
      key="loc"
      coords={coords}
      geo={geo}
      locating={locating}
      onDetect={detectLocation}
      onEdit={() => setConfirmLoc(true)}
    />,
    <InstructionsStep key="instr" />,
  ]

  const canAdvance =
    step === 0
      ? name.trim().length >= 2
      : step === 1
        ? typeof targetHours === 'number' && targetHours > 0
        : step === 2
          ? !!coords
          : true

  return (
    <Page className="mx-auto flex min-h-screen max-w-md flex-col px-6 pb-8 safe-top">
      {/* header + progress */}
      <div className="flex items-center gap-3 py-6">
        <Logo size="sm" />
        <div className="flex flex-1 gap-1.5">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= step ? 'bg-lavender-500' : 'bg-lavender-200'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            initial={{ opacity: 0, x: dir * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * -40 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="h-full"
          >
            {steps[step]}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* nav */}
      <div className="flex gap-3 pt-4">
        {step > 0 && (
          <button className="btn-ghost" onClick={() => go(step - 1)} disabled={saving}>
            <ChevronLeft size={18} />
          </button>
        )}
        {step < steps.length - 1 ? (
          <button className="btn-primary flex-1" onClick={() => go(step + 1)} disabled={!canAdvance}>
            Continue <ChevronRight size={18} />
          </button>
        ) : (
          <button className="btn-primary flex-1" onClick={finish} disabled={!coords || saving}>
            {saving ? <Spinner size={18} /> : <CheckCircle2 size={18} />}
            Finish setup
          </button>
        )}
      </div>

      <ConfirmModal
        open={confirmLoc}
        title="Set this as your workplace?"
        icon={<Building2 size={26} />}
        confirmLabel="Yes, save workplace"
        cancelLabel="Let me re-check"
        onConfirm={() => setConfirmLoc(false)}
        onCancel={() => {
          setConfirmLoc(false)
          setCoords(null)
          setGeo(null)
        }}
        message={
          <div className="mt-1 text-left">
            <div className="rounded-2xl bg-lavender-50 p-4">
              <p className="font-bold text-lavender-700">
                {geo?.place_name || geo?.city || 'Selected location'}
              </p>
              <p className="mt-1 text-[13px] leading-snug text-lavender-700/70">
                {geo?.address || 'Address unavailable'}
              </p>
              {coords && (
                <p className="mt-2 text-[11px] font-semibold text-lavender-400">
                  {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
                  {coords.accuracy ? ` · ±${Math.round(coords.accuracy)}m` : ''}
                </p>
              )}
            </div>
            <p className="mt-3 text-center text-[13px] text-lavender-700/60">
              You’ll be able to clock in within {CLOCK_IN_RADIUS_METERS / 1000} km of here.
            </p>
          </div>
        }
      />
    </Page>
  )
}

function NameStep({
  name,
  setName,
  onNext,
}: {
  name: string
  setName: (v: string) => void
  onNext: () => void
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="mb-6 grid h-14 w-14 place-items-center rounded-3xl bg-gradient-to-br from-lavender-400 to-lavender-600 text-white shadow-soft">
        <Sparkles size={26} />
      </div>
      <h2 className="text-2xl font-black text-lavender-700">What should we call you?</h2>
      <p className="mt-2 text-[15px] text-lavender-700/70">
        This is the name shown on your profile and logs.
      </p>
      <div className="mt-6">
        <label className="label">Your name</label>
        <input
          className="input"
          placeholder="e.g. Alex Santos"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && name.trim().length >= 2 && onNext()}
          autoFocus
        />
      </div>
    </div>
  )
}

function OjtHoursStep({
  hours,
  setHours,
}: {
  hours: number | ''
  setHours: (v: number | '') => void
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="mb-6 grid h-14 w-14 place-items-center rounded-3xl bg-gradient-to-br from-peach-400 to-peach-500 text-white shadow-soft">
        <Timer size={26} />
      </div>
      <h2 className="text-2xl font-black text-lavender-700">How long is your OJT?</h2>
      <p className="mt-2 text-[15px] text-lavender-700/70">
        Set the total number of hours you need to complete. We’ll track your progress and cheer you
        on when you finish.
      </p>

      <div className="mt-6">
        <label className="label">Required hours</label>
        <div className="flex flex-wrap gap-2">
          {HOURS_PRESETS.map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => setHours(h)}
              className={`flex-1 rounded-2xl border-2 py-3 text-sm font-bold transition ${
                hours === h
                  ? 'border-peach-400 bg-peach-100 text-peach-500'
                  : 'border-lavender-100 bg-white/60 text-lavender-400'
              }`}
            >
              {h}h
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <label className="label">Or enter a custom amount</label>
        <div className="relative">
          <input
            className="input pr-16"
            type="number"
            inputMode="numeric"
            min={1}
            max={5000}
            placeholder="e.g. 486"
            value={hours}
            onChange={(e) => {
              const v = e.target.value
              setHours(v === '' ? '' : Math.max(0, Math.min(5000, Math.round(Number(v)))))
            }}
          />
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-lavender-400">
            hours
          </span>
        </div>
      </div>
    </div>
  )
}

function LocationStep({
  coords,
  geo,
  locating,
  onDetect,
  onEdit,
}: {
  coords: Coords | null
  geo: ReverseGeocode | null
  locating: boolean
  onDetect: () => void
  onEdit: () => void
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="mb-6 grid h-14 w-14 place-items-center rounded-3xl bg-gradient-to-br from-mint-400 to-mint-500 text-white shadow-soft">
        <MapPin size={26} />
      </div>
      <h2 className="text-2xl font-black text-lavender-700">Set your workplace</h2>
      <p className="mt-2 text-[15px] text-lavender-700/70">
        We’ll use your current GPS position to mark where you work.
      </p>

      {!coords ? (
        <button
          onClick={onDetect}
          disabled={locating}
          className="mt-6 flex flex-col items-center gap-3 rounded-3xl border-2 border-dashed border-lavender-200 bg-white/60 py-10 text-lavender-600 hover:border-lavender-400 hover:bg-white transition"
        >
          {locating ? <Spinner size={28} /> : <Crosshair size={30} />}
          <span className="font-bold">
            {locating ? 'Finding your location…' : 'Use my current location'}
          </span>
        </button>
      ) : (
        <div className="mt-6 space-y-4">
          <div className="card overflow-hidden">
            <div className="flex items-center gap-3 bg-gradient-to-br from-mint-100 to-lavender-100 p-4">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-mint-500 shadow-card">
                <Building2 size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-extrabold text-lavender-700">
                  {geo?.place_name || geo?.city || 'Your workplace'}
                </p>
                <p className="truncate text-[13px] text-lavender-700/60">
                  {geo?.city || geo?.region || 'Location saved'}
                </p>
              </div>
            </div>
            <p className="px-4 py-3 text-[13px] leading-snug text-lavender-700/70">
              {geo?.address || 'Address unavailable'}
            </p>
          </div>
          <button className="btn-soft w-full" onClick={onEdit}>
            <Crosshair size={16} /> Re-check location
          </button>
        </div>
      )}

      <p className="mt-6 rounded-2xl bg-lavender-50 p-4 text-center text-[13px] font-semibold text-lavender-600">
        You’ll be able to clock in within {CLOCK_IN_RADIUS_METERS / 1000} km of your workplace.
      </p>
    </div>
  )
}

function InstructionsStep() {
  const cards = [
    {
      icon: MapPin,
      color: 'from-mint-400 to-mint-500',
      title: 'Be at your workplace',
      body: 'When you tap “Clock in”, Clock It! checks your GPS against your saved workplace.',
    },
    {
      icon: ShieldCheck,
      color: 'from-lavender-400 to-lavender-600',
      title: 'Get verified',
      body: 'If you’re within your allowed radius, you’re verified and the timer can start.',
    },
    {
      icon: Timer,
      color: 'from-peach-400 to-peach-500',
      title: 'Log your day',
      body: 'Add a title, notes and a photo. Clock out anytime — no location needed to leave.',
    },
  ]
  return (
    <div className="flex h-full flex-col">
      <h2 className="text-2xl font-black text-lavender-700">How clocking in works</h2>
      <p className="mt-2 text-[15px] text-lavender-700/70">Three quick things to know.</p>
      <div className="mt-6 space-y-3">
        {cards.map((c, i) => (
          <motion.div
            key={c.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i }}
            className="card flex items-start gap-4 p-4"
          >
            <div
              className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${c.color} text-white`}
            >
              <c.icon size={22} />
            </div>
            <div>
              <p className="font-extrabold text-lavender-700">
                {i + 1}. {c.title}
              </p>
              <p className="mt-0.5 text-[13px] leading-snug text-lavender-700/60">{c.body}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
