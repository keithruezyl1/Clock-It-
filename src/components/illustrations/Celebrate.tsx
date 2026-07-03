import { MascotFigure } from './Mascot'

/** Excited mascot with confetti — for the OJT-complete celebration. */
export function CelebrateIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 180 150" className={className} aria-hidden="true" focusable="false">
      {/* confetti */}
      <g>
        <rect x="18" y="26" width="7" height="7" rx="1.5" fill="rgb(var(--c-warning-400))" transform="rotate(24 21 29)" />
        <rect x="150" y="20" width="7" height="7" rx="1.5" fill="rgb(var(--c-success-400))" transform="rotate(-18 153 23)" />
        <rect x="160" y="82" width="6" height="6" rx="1.5" fill="rgb(var(--c-info-400))" transform="rotate(30 163 85)" />
        <rect x="10" y="88" width="6" height="6" rx="1.5" fill="rgb(var(--c-primary-400))" transform="rotate(-28 13 91)" />
        <circle cx="38" cy="10" r="3.2" fill="rgb(var(--c-info-400))" />
        <circle cx="142" cy="52" r="3.2" fill="rgb(var(--c-warning-400))" />
        <circle cx="30" cy="58" r="3" fill="rgb(var(--c-success-400))" />
        <circle cx="152" cy="118" r="3" fill="rgb(var(--c-primary-300))" />
        <path d="M132 8 l2.2 4.8 4.8 2.2 -4.8 2.2 -2.2 4.8 -2.2 -4.8 -4.8 -2.2 4.8 -2.2 z" fill="rgb(var(--c-primary-400))" />
        <path d="M14 116 l1.8 4 4 1.8 -4 1.8 -1.8 4 -1.8 -4 -4 -1.8 4 -1.8 z" fill="rgb(var(--c-warning-400))" />
      </g>

      <g transform="translate(30 8)">
        <MascotFigure mood="excited" />
      </g>
    </svg>
  )
}
