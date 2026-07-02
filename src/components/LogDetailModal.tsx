import { Modal } from './Modal'
import type { AttendanceLog } from '../lib/types'
import { fmtTime, fmtDateLong, fmtDuration } from '../lib/format'
import { LogIn, LogOut, Clock, StickyNote, MapPin, Trash2 } from 'lucide-react'

interface Props {
  log: AttendanceLog | null
  onClose: () => void
  onDelete?: (log: AttendanceLog) => void
}

export function LogDetailModal({ log, onClose, onDelete }: Props) {
  return (
    <Modal open={!!log} onClose={onClose} title={log ? fmtDateLong(log.work_date) : ''}>
      {log && (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-2xl bg-lavender-50 p-4">
            <div className="text-center">
              <p className="text-[11px] font-bold uppercase tracking-wide text-lavender-400">In</p>
              <p className="text-lg font-extrabold text-lavender-700">{fmtTime(log.clock_in_at)}</p>
            </div>
            <div className="flex flex-col items-center text-mint-500">
              <Clock size={18} />
              <p className="mt-0.5 text-xs font-bold text-lavender-500">
                {fmtDuration(log.clock_in_at, log.clock_out_at)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[11px] font-bold uppercase tracking-wide text-lavender-400">Out</p>
              <p className="text-lg font-extrabold text-lavender-700">
                {log.clock_out_at ? fmtTime(log.clock_out_at) : '—'}
              </p>
            </div>
          </div>

          {(log.title || log.clock_in_distance_m != null) && (
            <div className="flex items-center justify-between gap-3">
              <p className="min-w-0 flex-1 truncate text-sm font-extrabold text-lavender-700">
                {log.title || 'Daily log'}
              </p>
              {log.clock_in_distance_m != null && (
                <div className="flex shrink-0 items-center gap-1.5 text-[13px] text-lavender-700/60">
                  <MapPin size={15} className="text-mint-500" />
                  Verified {Math.round(log.clock_in_distance_m)} m from workplace
                </div>
              )}
            </div>
          )}

          <Section
            icon={<LogIn size={16} />}
            label="Clock-in notes"
            text={log.clock_in_notes}
            photo={log.clock_in_photo_url}
          />
          <Section
            icon={<LogOut size={16} />}
            label="Clock-out notes"
            text={log.clock_out_notes}
            photo={log.clock_out_photo_url}
          />

          {onDelete && (
            <button
              className="btn w-full bg-peach-100 text-peach-500 hover:bg-peach-200"
              onClick={() => onDelete(log)}
            >
              <Trash2 size={16} /> Delete this log
            </button>
          )}
        </div>
      )}
    </Modal>
  )
}

function Section({
  icon,
  label,
  text,
  photo,
}: {
  icon: React.ReactNode
  label: string
  text: string | null
  photo: string | null
}) {
  if (!text && !photo) return null
  return (
    <div className="rounded-2xl border border-lavender-100 p-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-bold text-lavender-600">
        {icon} {label}
      </div>
      {text ? (
        <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-lavender-700/80">
          {text}
        </p>
      ) : (
        <p className="flex items-center gap-1.5 text-[13px] italic text-lavender-300">
          <StickyNote size={14} /> No notes
        </p>
      )}
      {photo && (
        <img
          src={photo}
          alt={label}
          className="mt-3 max-h-56 w-full rounded-2xl object-cover"
          loading="lazy"
        />
      )}
    </div>
  )
}
