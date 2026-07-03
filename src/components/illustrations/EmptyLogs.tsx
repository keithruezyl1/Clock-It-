import { MascotFigure } from './Mascot'

/** Sleepy mascot dozing on a cloud — shown when there are no logs yet. */
export function EmptyLogsIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 180 150" className={className} aria-hidden="true" focusable="false">
      {/* cloud */}
      <g fill="rgb(var(--c-primary-100))">
        <ellipse cx="90" cy="132" rx="62" ry="14" />
        <circle cx="46" cy="126" r="14" />
        <circle cx="134" cy="126" r="14" />
        <circle cx="76" cy="122" r="17" />
        <circle cx="108" cy="122" r="17" />
      </g>

      {/* zzz */}
      <g fill="rgb(var(--c-primary-300))" fontFamily="inherit" fontWeight="800">
        <text x="138" y="34" fontSize="20">z</text>
        <text x="152" y="20" fontSize="14">z</text>
        <text x="162" y="10" fontSize="10">z</text>
      </g>

      <g transform="translate(30 4)">
        <MascotFigure mood="sleepy" />
      </g>
    </svg>
  )
}
