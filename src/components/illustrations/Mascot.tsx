import { useId } from 'react'

export type MascotMood = 'happy' | 'sleepy' | 'excited'

/**
 * "Tick", the Clock It! alarm-clock mascot. All fills come from theme CSS
 * variables so the character recolors with the active theme.
 *
 * `MascotFigure` renders the raw <g> (120x130 design box, top-left origin)
 * for composing into larger scenes; `Mascot` is the standalone <svg>.
 */
export function MascotFigure({ mood = 'happy' }: { mood?: MascotMood }) {
  const id = useId().replace(/:/g, '')
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-body`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={{ stopColor: 'rgb(var(--c-primary-400))' }} />
          <stop offset="1" style={{ stopColor: 'rgb(var(--c-primary-600))' }} />
        </linearGradient>
      </defs>

      {/* legs */}
      <rect x="42" y="106" width="9" height="16" rx="4.5" fill="rgb(var(--c-primary-600))" transform="rotate(14 46 114)" />
      <rect x="69" y="106" width="9" height="16" rx="4.5" fill="rgb(var(--c-primary-600))" transform="rotate(-14 74 114)" />

      {/* alarm bells */}
      <circle cx="30" cy="20" r="9" fill="rgb(var(--c-primary-600))" />
      <circle cx="90" cy="20" r="9" fill="rgb(var(--c-primary-600))" />
      <rect x="56" y="6" width="8" height="10" rx="4" fill="rgb(var(--c-primary-600))" />

      {/* body + face plate */}
      <circle cx="60" cy="64" r="48" fill={`url(#${id}-body)`} />
      <circle cx="60" cy="64" r="38" fill="rgb(var(--surface))" />

      {/* ticks */}
      <circle cx="60" cy="32" r="2.6" fill="rgb(var(--c-primary-300))" />
      <circle cx="92" cy="64" r="2.6" fill="rgb(var(--c-primary-300))" />
      <circle cx="60" cy="96" r="2.6" fill="rgb(var(--c-primary-300))" />
      <circle cx="28" cy="64" r="2.6" fill="rgb(var(--c-primary-300))" />

      {/* eyes */}
      {mood === 'sleepy' ? (
        <>
          <path d="M41 58 q 5.5 4.5 11 0" fill="none" stroke="rgb(var(--c-primary-700))" strokeWidth="2.6" strokeLinecap="round" />
          <path d="M68 58 q 5.5 4.5 11 0" fill="none" stroke="rgb(var(--c-primary-700))" strokeWidth="2.6" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="46.5" cy="57" r="3.6" fill="rgb(var(--c-primary-700))" />
          <circle cx="73.5" cy="57" r="3.6" fill="rgb(var(--c-primary-700))" />
        </>
      )}

      {/* blush */}
      <ellipse cx="40" cy="68" rx="4.2" ry="2.6" fill="rgb(var(--c-warning-300))" opacity="0.75" />
      <ellipse cx="80" cy="68" rx="4.2" ry="2.6" fill="rgb(var(--c-warning-300))" opacity="0.75" />

      {/* mouth */}
      {mood === 'excited' ? (
        <path d="M51 66 q 9 13 18 0 z" fill="rgb(var(--c-primary-700))" />
      ) : mood === 'sleepy' ? (
        <path d="M54 70 q 6 3.5 12 0" fill="none" stroke="rgb(var(--c-primary-700))" strokeWidth="2.6" strokeLinecap="round" />
      ) : (
        <path d="M51 66 q 9 8 18 0" fill="none" stroke="rgb(var(--c-primary-700))" strokeWidth="2.8" strokeLinecap="round" />
      )}
    </g>
  )
}

export function Mascot({
  mood = 'happy',
  className,
}: {
  mood?: MascotMood
  className?: string
}) {
  return (
    <svg viewBox="0 0 120 130" className={className} aria-hidden="true" focusable="false">
      <MascotFigure mood={mood} />
    </svg>
  )
}
