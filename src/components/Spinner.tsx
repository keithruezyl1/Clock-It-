import { Loader2 } from 'lucide-react'

export function Spinner({ size = 20, className = '' }: { size?: number; className?: string }) {
  return <Loader2 size={size} className={`animate-spin ${className}`} />
}

export function FullScreenLoader({ label }: { label?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-lavender-500">
      <div className="grid h-16 w-16 animate-float place-items-center rounded-3xl bg-gradient-to-br from-lavender-400 to-lavender-600 text-white shadow-soft">
        <Spinner size={28} />
      </div>
      {label && <p className="text-sm font-semibold text-lavender-600">{label}</p>}
    </div>
  )
}
