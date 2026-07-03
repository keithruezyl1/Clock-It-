# Clock It! ⏰

A sleek, pastel PWA for tracking your OJT (on-the-job training) time — with GPS-verified clock-ins, daily logs, photos, and notes.

## Features

- **Installable PWA** — add Clock It! to your home screen for a full-screen, app-like experience
- **First-run permissions** — asks for notifications, location, camera, and photos up front
- **Multi-step onboarding** — set your name, mark your workplace via GPS (reverse-geocoded and saved), and learn how clocking in works
- **GPS-verified clock-in** — the app checks you're within your allowed radius (default 3 km) of your workplace before starting the timer
- **Daily logs** — clock in with a title, optional notes/tasks, and an optional photo (camera or gallery); clock out with a summary and photo (no location check)
- **Dashboard** — live session card, daily log history, tap any log for full details
- **Profile** — edit your name/phone, view stats, update your workplace, install the app, sign out
- **Auth** — email/password registration + Google OAuth via Supabase
- Confirmation modals for every meaningful action, smooth bubbly animations throughout

## Stack

- Vite + React 18 + TypeScript
- Tailwind CSS + Framer Motion + Lucide icons
- Supabase (Postgres + RLS, Auth, Storage)
- vite-plugin-pwa (service worker + manifest)

## Local development

```bash
npm install
cp .env.example .env   # fill in your Supabase URL + publishable key
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Supabase setup

The database schema lives in Supabase migrations (`profiles`, `work_locations`, `attendance_logs`, plus the `attendance-photos` storage bucket), all protected by row-level security scoped to the signed-in user.

To enable **Google OAuth**: Supabase Dashboard → Authentication → Providers → Google → add your Google Cloud OAuth client ID/secret, and add your deployed URL to **Authentication → URL Configuration** (Site URL + `https://<your-domain>/auth/callback` as a redirect URL).

## Design conventions

- **Theming**: all colors resolve through CSS variables defined in `src/index.css` (`--c-primary-*`, `--c-success/warning/info-*`, `--surface`, `--bg-*`, `--text-body`). Theme presets and dark variants are scoped to `[data-theme]` / `[data-mode]` attribute blocks; `src/lib/themes.ts` holds the preset metadata and `src/context/ThemeContext.tsx` applies/persists the selection.
- **Icons**: lucide-react only. Default `strokeWidth={2.25}` for standalone icons; sizes come from the fixed scale **13 / 15 / 18 / 22 / 26**.
- **Illustrations**: hand-built SVG components in `src/components/illustrations/`, all fills via theme CSS variables so they recolor with the active theme. The mascot ("Tick", a round alarm clock) lives in `Mascot.tsx` and is composed into scenes (empty state, celebration, onboarding steps, heroes). Keep each SVG under 8 KB; no raster illustration assets.
- **Radii/shadows**: rounded-2xl/3xl/4xl and shadow-soft/card only.

## Notes

- Location verification uses the browser Geolocation API + Haversine distance against your saved workplace.
- Reverse geocoding uses OpenStreetMap Nominatim (no API key required).
- Photos upload to Supabase Storage under a per-user folder.
