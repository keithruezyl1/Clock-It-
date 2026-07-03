import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Pencil,
  LogOut,
  MapPin,
  Building2,
  Download,
  Smartphone,
  Clock3,
  CalendarCheck,
  Crosshair,
  ChevronRight,
  Share,
  Check,
  Sun,
  Moon,
  MonitorSmartphone,
} from 'lucide-react'
import { Page } from '../components/Page'
import { Modal } from '../components/Modal'
import { ConfirmModal } from '../components/ConfirmModal'
import { PermissionsSection } from '../components/PermissionsSection'
import { Spinner } from '../components/Spinner'
import { useToast } from '../components/Toast'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { THEMES, type ThemeMode } from '../lib/themes'
import { supabase } from '../lib/supabase'
import { useInstallPrompt } from '../lib/useInstallPrompt'
import { getCurrentPosition, reverseGeocode, distanceMeters, type Coords, type ReverseGeocode } from '../lib/geo'
import { CLOCK_IN_RADIUS_METERS, DEFAULT_MAP_CENTER } from '../lib/constants'
import { MapPicker } from '../components/MapPicker'

export default function Profile() {
  const navigate = useNavigate()
  const toast = useToast()
  const { user, profile, workLocation, refreshProfile, refreshWorkLocation, signOut } = useAuth()
  const install = useInstallPrompt()

  const [stats, setStats] = useState({ logs: 0, minutes: 0 })
  const [editOpen, setEditOpen] = useState(false)
  const [name, setName] = useState(profile?.full_name ?? '')
  const [phone, setPhone] = useState(profile?.phone ?? '')
  const [targetHrs, setTargetHrs] = useState<number | ''>(profile?.ojt_target_hours ?? '')
  const [savingProfile, setSavingProfile] = useState(false)

  const [wlOpen, setWlOpen] = useState(false)
  const [signOutOpen, setSignOutOpen] = useState(false)
  const [iosOpen, setIosOpen] = useState(false)

  useEffect(() => {
    if (!user) return
    supabase
      .from('attendance_logs')
      .select('clock_in_at, clock_out_at')
      .eq('user_id', user.id)
      .then(({ data }) => {
        const rows = data ?? []
        let minutes = 0
        for (const r of rows) {
          if (r.clock_in_at && r.clock_out_at) {
            minutes += (new Date(r.clock_out_at).getTime() - new Date(r.clock_in_at).getTime()) / 60000
          }
        }
        setStats({ logs: rows.length, minutes: Math.round(minutes) })
      })
  }, [user])

  const saveProfile = async () => {
    if (!user) return
    setSavingProfile(true)
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: name.trim(),
        phone: phone.trim() || null,
        ojt_target_hours: typeof targetHrs === 'number' ? targetHrs : null,
      })
      .eq('id', user.id)
    setSavingProfile(false)
    if (error) {
      toast('error', error.message)
      return
    }
    await refreshProfile()
    toast('success', 'Profile updated.')
    setEditOpen(false)
  }

  const initials = (profile?.full_name || user?.email || '?')
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const totalHours = Math.floor(stats.minutes / 60)
  const totalMins = stats.minutes % 60

  const targetHours = profile?.ojt_target_hours ?? null
  const ojtDone = targetHours != null && stats.minutes >= targetHours * 60
  const remainingHours =
    targetHours != null ? Math.ceil(Math.max(0, targetHours * 60 - stats.minutes) / 60) : null
  const hoursSub =
    targetHours == null
      ? undefined
      : ojtDone
        ? '🎉 OJT complete!'
        : `${remainingHours} hour${remainingHours === 1 ? '' : 's'} to go!`

  const handleInstall = async () => {
    if (install.isIOS && !install.canInstall) {
      setIosOpen(true)
      return
    }
    const res = await install.promptInstall()
    if (res === 'accepted') toast('success', 'Clock It! added to your home screen!')
    else if (res === 'unavailable') setIosOpen(true)
  }

  return (
    <Page className="px-5 safe-top">
      <header className="py-6">
        <h1 className="text-2xl font-black text-lavender-700">Profile</h1>
      </header>

      {/* identity */}
      <div className="card flex items-center gap-4 p-5">
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} alt="" className="h-16 w-16 rounded-3xl object-cover" />
        ) : (
          <div className="grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-br from-lavender-400 to-lavender-600 text-xl font-black text-white">
            {initials}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-extrabold text-lavender-700">
            {profile?.full_name || 'Your name'}
          </p>
          <p className="truncate text-[13px] text-lavender-700/60">{user?.email}</p>
          {profile?.phone && (
            <p className="truncate text-[13px] text-lavender-700/60">{profile.phone}</p>
          )}
        </div>
        <button
          onClick={() => {
            setName(profile?.full_name ?? '')
            setPhone(profile?.phone ?? '')
            setTargetHrs(profile?.ojt_target_hours ?? '')
            setEditOpen(true)
          }}
          className="grid h-10 w-10 place-items-center rounded-2xl bg-lavender-100 text-lavender-600"
          aria-label="Edit profile"
        >
          <Pencil size={18} />
        </button>
      </div>

      {/* stats */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <StatTile
          icon={<CalendarCheck size={20} />}
          value={String(stats.logs)}
          label="Total logs"
          color="from-mint-400 to-mint-500"
        />
        <StatTile
          icon={<Clock3 size={20} />}
          value={`${totalHours}h ${totalMins}m`}
          label="Hours logged"
          color="from-lavender-400 to-lavender-600"
          sub={hoursSub}
        />
      </div>

      {/* workplace */}
      <SectionTitle>Workplace</SectionTitle>
      <div className="card p-5">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-mint-100 text-mint-500">
            <Building2 size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-extrabold text-lavender-700">
              {workLocation?.place_name || workLocation?.city || 'No workplace set'}
            </p>
            <p className="text-[13px] leading-snug text-lavender-700/60">
              {workLocation?.address || 'Set your workplace to clock in.'}
            </p>
            {workLocation && (
              <p className="mt-1 flex items-center gap-1 text-[12px] font-semibold text-lavender-400">
                <MapPin size={12} /> {(workLocation.radius_meters / 1000).toFixed(0)} km clock-in radius
              </p>
            )}
          </div>
        </div>
        <button className="btn-soft mt-4 w-full" onClick={() => setWlOpen(true)}>
          <Crosshair size={16} /> Update workplace
        </button>
      </div>

      {/* appearance */}
      <SectionTitle>Appearance</SectionTitle>
      <AppearanceCard />

      {/* permissions */}
      <SectionTitle>Permissions</SectionTitle>
      <PermissionsSection />

      {/* install */}
      <SectionTitle>App</SectionTitle>
      <button
        onClick={handleInstall}
        disabled={install.installed}
        className="card flex w-full items-center gap-4 p-5 text-left active:scale-[0.99] transition disabled:opacity-70"
      >
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-sky-400 to-sky-500 text-white">
          {install.installed ? <Check size={22} /> : <Download size={22} />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-extrabold text-lavender-700">
            {install.installed ? 'Installed' : 'Add Clock It! to your home screen'}
          </p>
          <p className="text-[13px] text-lavender-700/60">
            {install.installed
              ? 'You’re running the installed app.'
              : 'Install for quick, full-screen access.'}
          </p>
        </div>
        {!install.installed && <ChevronRight size={18} className="text-lavender-300" />}
      </button>

      {/* sign out */}
      <button
        className="btn mt-6 w-full bg-surface/70 text-peach-500 shadow-card hover:bg-surface"
        onClick={() => setSignOutOpen(true)}
      >
        <LogOut size={18} /> Sign out
      </button>

      <p className="mt-6 text-center text-xs text-lavender-700/40">Clock It! · v1.0</p>

      {/* edit profile */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit profile">
        <div className="space-y-3">
          <div>
            <label className="label">Full name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="label">Phone (optional)</label>
            <input
              className="input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +63 900 000 0000"
              inputMode="tel"
            />
          </div>
          <div>
            <label className="label">OJT target hours</label>
            <input
              className="input"
              type="number"
              inputMode="numeric"
              min={1}
              max={5000}
              placeholder="e.g. 500"
              value={targetHrs}
              onChange={(e) => {
                const v = e.target.value
                setTargetHrs(v === '' ? '' : Math.max(0, Math.min(5000, Math.round(Number(v)))))
              }}
            />
            <p className="mt-1 ml-1 text-[12px] text-lavender-700/50">
              Used to show your remaining hours and celebrate when you finish.
            </p>
          </div>
          <button
            className="btn-primary mt-2 w-full"
            onClick={saveProfile}
            disabled={savingProfile || name.trim().length < 2}
          >
            {savingProfile ? <Spinner size={18} /> : 'Save changes'}
          </button>
        </div>
      </Modal>

      <UpdateWorkplaceModal
        open={wlOpen}
        onClose={() => setWlOpen(false)}
        onSaved={refreshWorkLocation}
      />

      <ConfirmModal
        open={signOutOpen}
        title="Sign out?"
        icon={<LogOut size={26} />}
        tone="danger"
        confirmLabel="Sign out"
        message="You’ll need to sign in again to access your logs."
        onConfirm={async () => {
          setSignOutOpen(false)
          await signOut()
          navigate('/auth', { replace: true })
        }}
        onCancel={() => setSignOutOpen(false)}
      />

      {/* iOS install instructions */}
      <Modal open={iosOpen} onClose={() => setIosOpen(false)} title="Add to Home Screen">
        <div className="space-y-3 text-[15px] text-lavender-700/80">
          <p>To install Clock It! on your device:</p>
          <ol className="space-y-2">
            <li className="flex items-center gap-3 rounded-2xl bg-lavender-50 p-3">
              <Share size={20} className="shrink-0 text-lavender-500" />
              Tap the <b>Share</b> button in your browser.
            </li>
            <li className="flex items-center gap-3 rounded-2xl bg-lavender-50 p-3">
              <Smartphone size={20} className="shrink-0 text-lavender-500" />
              Choose <b>Add to Home Screen</b>.
            </li>
          </ol>
          <button className="btn-primary mt-2 w-full" onClick={() => setIosOpen(false)}>
            Got it
          </button>
        </div>
      </Modal>
    </Page>
  )
}

const MODE_OPTIONS: { id: ThemeMode; label: string; icon: React.ReactNode }[] = [
  { id: 'light', label: 'Light', icon: <Sun size={15} /> },
  { id: 'dark', label: 'Dark', icon: <Moon size={15} /> },
  { id: 'system', label: 'System', icon: <MonitorSmartphone size={15} /> },
]

function AppearanceCard() {
  const { theme, mode, setTheme, setMode } = useTheme()
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        {THEMES.map((t) => (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            aria-label={`${t.label} theme`}
            title={t.label}
            className={`grid h-11 w-11 place-items-center rounded-full transition active:scale-95 ${
              theme === t.id ? 'ring-2 ring-lavender-400 ring-offset-2 ring-offset-surface' : ''
            }`}
          >
            <span
              className="grid h-9 w-9 place-items-center rounded-full text-white"
              style={{ background: t.swatch }}
            >
              {theme === t.id && <Check size={16} strokeWidth={3} />}
            </span>
          </button>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-3 gap-1 rounded-2xl bg-lavender-100 p-1">
        {MODE_OPTIONS.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-[13px] font-bold transition ${
              mode === m.id ? 'bg-surface text-lavender-700 shadow-card' : 'text-lavender-700/50'
            }`}
          >
            {m.icon} {m.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function StatTile({
  icon,
  value,
  label,
  color,
  sub,
}: {
  icon: React.ReactNode
  value: string
  label: string
  color: string
  sub?: string
}) {
  return (
    <div className="card p-4">
      <div className={`grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br ${color} text-white`}>
        {icon}
      </div>
      <p className="mt-3 text-2xl font-black text-lavender-700">{value}</p>
      <p className="text-[13px] font-semibold text-lavender-700/60">{label}</p>
      {sub && <p className="mt-0.5 text-[11px] font-bold text-lavender-400">{sub}</p>}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 mt-7 ml-1 text-sm font-extrabold uppercase tracking-wide text-lavender-400">{children}</h2>
}

function UpdateWorkplaceModal({
  open,
  onClose,
  onSaved,
}: {
  open: boolean
  onClose: () => void
  onSaved: () => Promise<void>
}) {
  const toast = useToast()
  const { user } = useAuth()
  const [coords, setCoords] = useState<Coords | null>(null)
  const [geo, setGeo] = useState<ReverseGeocode | null>(null)
  const [locating, setLocating] = useState(false)
  const [geoLoading, setGeoLoading] = useState(false)
  const [showMap, setShowMap] = useState(false)
  const [saving, setSaving] = useState(false)

  const detect = async () => {
    setLocating(true)
    try {
      const c = await getCurrentPosition()
      setCoords(c)
      setGeo(await reverseGeocode(c))
    } catch (err) {
      toast('error', (err as Error).message)
    } finally {
      setLocating(false)
    }
  }

  // A manual pin from the map: update coords instantly, then look up its address.
  const handlePick = (latitude: number, longitude: number) => {
    const c = { latitude, longitude }
    setCoords(c)
    setGeoLoading(true)
    reverseGeocode(c)
      .then(setGeo)
      .finally(() => setGeoLoading(false))
  }

  const close = () => {
    setShowMap(false)
    setCoords(null)
    setGeo(null)
    onClose()
  }

  const save = async () => {
    if (!user || !coords) return
    setSaving(true)
    try {
      await supabase.from('work_locations').update({ is_active: false }).eq('user_id', user.id)
      const { error } = await supabase.from('work_locations').insert({
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
      if (error) throw error
      await onSaved()
      toast('success', 'Workplace updated.')
      setCoords(null)
      setGeo(null)
      setShowMap(false)
      onClose()
    } catch (err) {
      toast('error', (err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={close} title="Update workplace">
      <div className="space-y-4">
        {coords ? (
          <div className="rounded-2xl bg-lavender-50 p-4">
            <p className="font-bold text-lavender-700">
              {geoLoading ? 'Looking up address…' : geo?.place_name || geo?.city || 'Pinned location'}
            </p>
            <p className="mt-1 text-[13px] text-lavender-700/70">
              {geo?.address || `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`}
            </p>
          </div>
        ) : (
          <p className="rounded-2xl bg-lavender-50 p-4 text-center text-[13px] text-lavender-700/60">
            Detect your location, or pin it manually on the map.
          </p>
        )}

        <div className="flex gap-2">
          <button onClick={detect} disabled={locating} className="btn-soft flex-1">
            {locating ? <Spinner size={18} /> : <Crosshair size={16} />}
            {coords ? 'Retry' : 'Use my location'}
          </button>
          <button onClick={() => setShowMap((s) => !s)} className="btn-soft flex-1">
            <MapPin size={16} /> {showMap ? 'Hide map' : 'Pin on map'}
          </button>
        </div>

        {showMap && (
          <div className="space-y-2">
            <MapPicker
              lat={coords?.latitude ?? DEFAULT_MAP_CENTER.latitude}
              lng={coords?.longitude ?? DEFAULT_MAP_CENTER.longitude}
              onPick={handlePick}
            />
            <p className="text-center text-[12px] text-lavender-400">
              Tap the map or drag the pin to set your workplace.
            </p>
          </div>
        )}

        <p className="rounded-2xl bg-lavender-50 p-4 text-center text-[13px] font-semibold text-lavender-600">
          You’ll be able to clock in within {CLOCK_IN_RADIUS_METERS / 1000} km of your workplace.
        </p>

        <button className="btn-primary w-full" onClick={save} disabled={!coords || saving}>
          {saving ? <Spinner size={18} /> : 'Save workplace'}
        </button>
      </div>
    </Modal>
  )
}
