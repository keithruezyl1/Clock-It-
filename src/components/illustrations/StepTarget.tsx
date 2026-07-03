import { MascotFigure } from './Mascot'

/** Mascot next to a goal flag — OJT target-hours onboarding step. */
export function StepTargetIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 180 140" className={className} aria-hidden="true" focusable="false">
      {/* goal flag */}
      <g transform="translate(134 18)">
        <rect x="0" y="0" width="4" height="98" rx="2" fill="rgb(var(--c-primary-300))" />
        <path d="M4 4 h34 l-9 11 9 11 h-34 z" fill="rgb(var(--c-warning-400))" />
      </g>
      {/* ground */}
      <ellipse cx="80" cy="128" rx="66" ry="7" fill="rgb(var(--c-primary-100))" />
      <g transform="translate(20 4)">
        <MascotFigure mood="happy" />
      </g>
    </svg>
  )
}
