import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Clock, LogOut, StickyNote, ImagePlus } from 'lucide-react'
import { Page } from '../components/Page'
import { FullScreenLoader, Spinner } from '../components/Spinner'
import { PhotoPicker } from '../components/PhotoPicker'
import { ConfirmModal } from '../components/ConfirmModal'
import { useToast } from '../components/Toast'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { useLogs } from '../lib/useLogs'
import { uploadPhoto } from '../lib/storage'
import type { AttendanceLog } from '../lib/types'
import { fmtTime, fmtDuration, todayDateStr } from '../lib/format'

export default function ClockOut() {
  const navigate = useNavigate()
  const toast = useToast()
  const { user } = useAuth()
  const { refresh } = useLogs()

  const [log, setLog] = useState<AttendanceLog | null>(null)
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(new Date())
  const [notes, setNotes] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [confirm, setConfirm] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (!user) return
    supabase
      .from('attendance_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('work_date', todayDateStr())
      .eq('status', 'active')
      .is('clock_out_at', null)
      .order('clock_in_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        setLog(data ?? null)
        setLoading(false)
        if (!data) {
          toast('info', 'No active session to clock out from.')
          navigate('/', { replace: true })
        }
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const save = async () => {
    if (!user || !log) return
    setSaving(true)
    try {
      let photoUrl: string | null = null
      if (photo) photoUrl = await uploadPhoto(user.id, photo, 'clockout')
      const { error } = await supabase
        .from('attendance_logs')
        .update({
          clock_out_at: new Date().toISOString(),
          clock_out_notes: notes.trim() || null,
          clock_out_photo_url: photoUrl,
          status: 'completed',
        })
        .eq('id', log.id)
      if (error) throw error
      if (navigator.vibrate) navigator.vibrate(10)
      toast('success', 'Clocked out. Nice work today!')
      void refresh()
      navigate('/', { replace: true })
    } catch (err) {
      toast('error', (err as Error).message || 'Could not clock out.')
      setSaving(false)
      setConfirm(false)
    }
  }

  if (loading) return <FullScreenLoader label="Loading your session…" />
  if (!log) return null

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
        <h1 className="text-xl font-black text-lavender-700">Clock out</h1>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-5 rounded-3xl bg-gradient-to-br from-peach-400 to-peach-500 p-5 text-center text-white shadow-soft"
      >
        <p className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wide text-white/85">
          <Clock size={14} /> Total time today
        </p>
        <p className="mt-1 text-4xl font-black tabular-nums">
          {fmtDuration(log.clock_in_at, now.toISOString())}
        </p>
        <p className="mt-1 text-sm text-white/90">
          In at {fmtTime(log.clock_in_at)} · Out at{' '}
          {now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
        </p>
      </motion.div>

      <div className="space-y-4">
        <div>
          <label className="label flex items-center gap-1.5">
            <StickyNote size={14} /> Notes / summary{' '}
            <span className="font-normal text-lavender-300">(optional)</span>
          </label>
          <textarea
            className="input min-h-[110px] resize-none"
            placeholder="What did you accomplish today?"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={800}
            autoFocus
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

      <button className="btn mt-6 w-full bg-gradient-to-br from-peach-400 to-peach-500 text-white shadow-soft" onClick={() => setConfirm(true)}>
        <LogOut size={18} /> Clock out now
      </button>

      <ConfirmModal
        open={confirm}
        title="Confirm clock-out?"
        icon={<LogOut size={26} />}
        tone="danger"
        confirmLabel="Yes, clock me out"
        cancelLabel="Not yet"
        loading={saving}
        message={
          <>
            End your work day at{' '}
            <span className="font-bold text-lavender-700">
              {now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
            </span>
            ? You’ve logged {fmtDuration(log.clock_in_at, now.toISOString())} today.
          </>
        }
        onConfirm={save}
        onCancel={() => setConfirm(false)}
      />
    </Page>
  )
}
