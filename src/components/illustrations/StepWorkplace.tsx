import { MascotFigure } from './Mascot'

/** Mascot with a map pin — workplace onboarding step. */
export function StepWorkplaceIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 180 140" className={className} aria-hidden="true" focusable="false">
      {/* map pin */}
      <g transform="translate(128 14)">
        <path
          d="M22 0 C 9.8 0 0 9.8 0 22 c 0 15 22 34 22 34 s 22 -19 22 -34 C 44 9.8 34.2 0 22 0 z"
          fill="rgb(var(--c-success-400))"
        />
        <circle cx="22" cy="21" r="9" fill="rgb(var(--surface))" />
      </g>
      {/* ground */}
      <ellipse cx="82" cy="128" rx="66" ry="7" fill="rgb(var(--c-primary-100))" />
      <g transform="translate(18 4)">
        <MascotFigure mood="happy" />
      </g>
    </svg>
  )
}
