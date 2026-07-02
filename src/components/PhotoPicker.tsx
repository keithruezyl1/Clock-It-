import { useRef, useState } from 'react'
import { Camera, ImagePlus, X } from 'lucide-react'
import { CameraModal } from './CameraModal'

interface PhotoPickerProps {
  file: File | null
  onChange: (file: File | null) => void
}

export function PhotoPicker({ file, onChange }: PhotoPickerProps) {
  const galleryRef = useRef<HTMLInputElement>(null)
  const [cameraOpen, setCameraOpen] = useState(false)
  const preview = file ? URL.createObjectURL(file) : null

  return (
    <div>
      {preview ? (
        <div className="relative overflow-hidden rounded-3xl border-2 border-lavender-100">
          <img src={preview} alt="Selected" className="max-h-64 w-full object-cover" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-black/50 text-white backdrop-blur hover:bg-black/70"
            aria-label="Remove photo"
          >
            <X size={18} />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setCameraOpen(true)}
            className="flex flex-col items-center gap-2 rounded-3xl border-2 border-dashed border-lavender-200 bg-white/60 py-6 text-lavender-600 hover:border-lavender-400 hover:bg-white transition"
          >
            <Camera size={26} />
            <span className="text-sm font-bold">Camera</span>
          </button>
          <button
            type="button"
            onClick={() => galleryRef.current?.click()}
            className="flex flex-col items-center gap-2 rounded-3xl border-2 border-dashed border-lavender-200 bg-white/60 py-6 text-lavender-600 hover:border-lavender-400 hover:bg-white transition"
          >
            <ImagePlus size={26} />
            <span className="text-sm font-bold">Gallery</span>
          </button>
        </div>
      )}

      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onChange(f)
          e.target.value = ''
        }}
      />
      <CameraModal open={cameraOpen} onClose={() => setCameraOpen(false)} onCapture={onChange} />
    </div>
  )
}
