import { MascotFigure } from './Mascot'

/** Happy mascot with sparkles — login, welcome, and name-step hero. */
export function HeroIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 180 140" className={className} aria-hidden="true" focusable="false">
      <g fill="rgb(var(--c-primary-300))">
        <path d="M28 30 l3 6.5 6.5 3 -6.5 3 -3 6.5 -3 -6.5 -6.5 -3 6.5 -3 z" />
        <path d="M152 54 l2.4 5.2 5.2 2.4 -5.2 2.4 -2.4 5.2 -2.4 -5.2 -5.2 -2.4 5.2 -2.4 z" />
        <circle cx="150" cy="24" r="3" />
        <circle cx="20" cy="78" r="2.6" />
      </g>
      <g transform="translate(30 4)">
        <MascotFigure mood="happy" />
      </g>
    </svg>
  )
}
