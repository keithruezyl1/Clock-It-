import { Clock } from 'lucide-react'

export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dim = size === 'lg' ? 'h-20 w-20' : size === 'sm' ? 'h-10 w-10' : 'h-14 w-14'
  const icon = size === 'lg' ? 40 : size === 'sm' ? 20 : 28
  return (
    <div
      className={`${dim} grid place-items-center rounded-[28%] bg-gradient-to-br from-lavender-400 via-lavender-500 to-lavender-600 text-white shadow-soft`}
    >
      <Clock size={icon} strokeWidth={2.4} />
    </div>
  )
}

export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`font-extrabold tracking-tight text-lavender-700 ${className}`}>
      Clock&nbsp;It<span className="text-lavender-400">!</span>
    </span>
  )
}
