import { useCallback, useEffect, useRef, useState } from 'react'
import { Modal } from './Modal'
import { Camera, RefreshCw, Check, X } from 'lucide-react'
import { Spinner } from './Spinner'

interface CameraModalProps {
  open: boolean
  onClose: () => void
  onCapture: (file: File) => void
}

export function CameraModal({ open, onClose, onCapture }: CameraModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [facing, setFacing] = useState<'environment' | 'user'>('environment')
  const [error, setError] = useState<string | null>(null)
  const [starting, setStarting] = useState(true)
  const [shot, setShot] = useState<string | null>(null)
  const shotFile = useRef<File | null>(null)

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  const start = useCallback(async () => {
    setStarting(true)
    setError(null)
    stop()
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play().catch(() => {})
      }
    } catch {
      setError('Could not access the camera. You can pick a photo from your gallery instead.')
    } finally {
      setStarting(false)
    }
  }, [facing, stop])

  useEffect(() => {
    if (open && !shot) start()
    return () => {
      if (!open) stop()
    }
  }, [open, facing, shot, start, stop])

  useEffect(() => {
    if (!open) {
      setShot(null)
      shotFile.current = null
      stop()
    }
  }, [open, stop])

  const takeShot = () => {
    const video = videoRef.current
    if (!video) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0)
    canvas.toBlob(
      (blob) => {
        if (!blob) return
        shotFile.current = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' })
        setShot(URL.createObjectURL(blob))
        stop()
      },
      'image/jpeg',
      0.85,
    )
  }

  const retake = () => {
    setShot(null)
    shotFile.current = null
  }

  const confirm = () => {
    if (shotFile.current) onCapture(shotFile.current)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Take a photo">
      <div className="overflow-hidden rounded-3xl bg-lavender-700/90 aspect-[3/4] relative grid place-items-center">
        {error ? (
          <p className="px-6 text-center text-sm font-semibold text-white/90">{error}</p>
        ) : shot ? (
          <img src={shot} alt="Captured" className="h-full w-full object-cover" />
        ) : (
          <>
            <video
              ref={videoRef}
              playsInline
              muted
              className="h-full w-full object-cover"
            />
            {starting && (
              <div className="absolute inset-0 grid place-items-center text-white">
                <Spinner size={28} />
              </div>
            )}
          </>
        )}
      </div>

      <div className="mt-5 flex items-center justify-center gap-3">
        {shot ? (
          <>
            <button className="btn-ghost flex-1" onClick={retake}>
              <RefreshCw size={18} /> Retake
            </button>
            <button className="btn-primary flex-1" onClick={confirm}>
              <Check size={18} /> Use photo
            </button>
          </>
        ) : error ? (
          <button className="btn-ghost w-full" onClick={onClose}>
            <X size={18} /> Close
          </button>
        ) : (
          <>
            <button
              className="btn-soft"
              onClick={() => setFacing((f) => (f === 'environment' ? 'user' : 'environment'))}
              aria-label="Flip camera"
            >
              <RefreshCw size={18} />
            </button>
            <button
              className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-lavender-500 to-lavender-600 text-white shadow-soft active:scale-95 transition"
              onClick={takeShot}
              aria-label="Capture"
              disabled={starting}
            >
              <Camera size={26} />
            </button>
            <div className="w-[52px]" />
          </>
        )}
      </div>
    </Modal>
  )
}
