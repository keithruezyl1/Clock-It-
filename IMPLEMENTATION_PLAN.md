# Clock It! — v2 Improvement Plan

Implementation plan for the next major iteration. Written to be executed phase-by-phase (each phase = one commit / PR, app stays shippable after each). Run `npm run build` (tsc + vite) after every phase — it must pass before moving on.

## Current state (verified against the codebase)

- Vite + React 18 + TS, Tailwind 3, framer-motion, lucide-react, date-fns, Supabase, vite-plugin-pwa.
- Pages: `Dashboard`, `Profile`, `ClockIn`, `ClockOut`, `Login`, `Onboarding`, `Permissions`, `AuthCallback`. Tabbed shell (`src/components/AppShell.tsx`) has 2 tabs: Home, Profile.
- Colors are **hardcoded Tailwind palette classes** (`lavender-*`, `mint-*`, `peach-*`, `sky-*`) across every file, plus a hardcoded body gradient and text color in `src/index.css`. This is the main blocker for theming — Phase 1 fixes it.
- `profiles.ojt_target_hours` already exists (migration `0002`); Dashboard already shows total hours, a progress bar, and a one-time `CelebrationModal`. Phase 4 upgrades this rather than building from scratch.
- Logs: one per user per day (unique index in `0004`), `status: 'active' | 'completed'`. Delete exists; there is **no handling for a session left open from a previous day** (it just sits in history as `active` forever).
- Fixed 10 km clock-in radius (`src/lib/constants.ts`).

---

## Phase 1 — Theme token refactor (groundwork, no visual change)

Goal: replace hardcoded palette classes with semantic tokens so themes become a data-attribute swap.

1. In `src/index.css`, define CSS variables on `:root` as **RGB triplets** (e.g. `--c-primary-500: 167 139 250;`) for these semantic roles:
   - `primary` (50–700) — currently lavender. Used for text, buttons, accents.
   - `success` (100–500) — currently mint. Clock-in / active / progress.
   - `warning` (100–500) — currently peach. Clock-out accents.
   - `info` (100–500) — currently sky.
   - `surface` (page bg gradient stops: `--bg-from`, `--bg-mid`, `--bg-to`), `--card-bg`, `--text-body`.
2. In `tailwind.config.js`, remap the existing color names to the variables using the alpha-value pattern so **no class renames are needed**:
   ```js
   lavender: {
     500: 'rgb(var(--c-primary-500) / <alpha-value>)',
     // ...all shades
   },
   ```
   Keeping the names `lavender`/`mint`/`peach`/`sky` avoids touching ~30 files; the names become semantic aliases. (Optional later cleanup: rename to `primary`/`success`/... via find-and-replace.)
3. Move the body gradient in `index.css` to use `var(--bg-from/mid/to)`; move body `color` to `var(--text-body)`. Update `.card`, `.glass`, `.input`, `.btn-*` component classes to variable-driven backgrounds where they use white/lavender literals (`bg-white/80` → `rgb(var(--card-bg) / 0.8)` via a small utility or arbitrary value).
4. Audit for remaining literals: shadows in `tailwind.config.js` (`boxShadow.soft/card/glow` embed purple rgba — convert to `rgba(var(--c-primary-600), …)` equivalents), `<meta name="theme-color">` in `index.html`, and the gradient in `src/components/Logo.tsx` if hardcoded.

Acceptance: app renders pixel-identical to today; `npm run build` passes.

## Phase 2 — Theme presets + dark mode ("Customize app")

1. Define 5 presets in a new `src/lib/themes.ts`: **Lavender (default), Mint, Peach, Sky, Mono/Slate** — each a full set of the Phase 1 variables, each with a `light` and `dark` variant. Dark variants: dark plum/near-black surface gradient, desaturated card bg (`--card-bg` becomes a dark RGB), lifted text color. Check WCAG AA contrast for body text and button text in every variant.
2. `src/context/ThemeContext.tsx`:
   - State: `{ theme: string, mode: 'light' | 'dark' | 'system' }`.
   - Applies `data-theme="mint"` + `data-mode="dark"` to `<html>`; CSS in `index.css` scopes variable overrides per `[data-theme]` / `[data-mode="dark"]`.
   - Persistence: write to `localStorage` (`clockit_theme_v1`) for flash-free boot **and** to a new `profiles.theme` / `profiles.theme_mode` column so it follows the user across devices. Inline a tiny script in `index.html` that reads localStorage and sets the attributes before first paint (avoids theme flash).
   - `system` mode follows `prefers-color-scheme` via matchMedia listener.
3. Migration `0005_theme.sql`: `alter table public.profiles add column theme text, add column theme_mode text;` (nullable, no backfill needed).
4. UI: new **Appearance** section in `src/pages/Profile.tsx` (above Permissions): a row of tappable swatch circles (theme presets) + a Light/Dark/System segmented control. Live-preview on tap, persist on selection. Also set `color-scheme` and update `<meta name="theme-color">` dynamically so the PWA titlebar matches.
5. PWA: `vite.config.ts` manifest `theme_color`/`background_color` stay as the default theme (manifest is static); dynamic meta tag handles the rest.

Acceptance: switching themes/mode updates the whole app instantly incl. modals, tab bar, and status cards; survives reload with no flash; persists to Supabase.

## Phase 3 — Export hours to Excel

1. Add `exceljs` (supports real styling in-browser). **Dynamically import** it inside the export function so it doesn't bloat the main bundle: `const ExcelJS = await import('exceljs')`.
2. New `src/lib/exportXlsx.ts`:
   - Input: `AttendanceLog[]`, profile name, range label.
   - Sheet "OJT Hours": title block (app name, student name, exported date, range), then columns: **Date | Day | Title | Clock in | Clock out | Duration (h) | Notes (in) | Notes (out) | Distance (m)**. Duration as decimal hours (2 dp) so the totals row can `SUM`.
   - Styling: themed header row fill (pull the current theme's primary hex from CSS vars), bold, frozen header, alternating row tint, borders, column widths, `TOTAL` row with a real `SUM` formula, and a summary block: total hours, target hours (`profile.ojt_target_hours`), remaining, % complete.
   - Open sessions in range: mark clock-out as `—` and exclude from the total.
   - Download via Blob + anchor; filename `ClockIt_<Name>_<from>_<to>.xlsx`.
3. UI: **Export button on Dashboard header** (Download icon next to the date chip) opening a new `ExportModal` (reuse `src/components/Modal.tsx`): range chips — This week / This month / All time / Custom (two date inputs) — plus a preview line ("23 logs · 142.5 h") and a themed download button. Query logs for the range (reuse the Dashboard `logs` state; filter client-side — data volume is tiny).
4. Also add an "Export hours" row in Profile → App section that opens the same modal.

Acceptance: exported file opens clean in Excel/Google Sheets; totals match Dashboard; works offline-ish (no network needed beyond the already-loaded logs).

## Phase 4 — Stats tab (weekly/monthly insights)

1. New page `src/pages/Stats.tsx`, added as a **third tab** in `AppShell.tsx` (icon: `BarChart3`, label "Stats", route `/stats`). Order: Home · Stats · Profile.
2. Content (all computed client-side from `attendance_logs`, no schema change):
   - **Week bar chart**: hours per day Mon–Sun, current week, with prev/next week arrows. Build with plain SVG/divs + framer-motion height animation — do **not** add a chart library; keep it on-theme (rounded bars, primary color, today highlighted).
   - **Month summary**: total hours, days worked, avg hours/worked-day.
   - **Streak**: current & best streak of consecutive worked days (weekdays-only toggle not needed v1).
   - **Records**: longest day, earliest clock-in, most common clock-in hour.
3. Extract shared computation into `src/lib/stats.ts` (pure functions over `AttendanceLog[]`, unit-testable): `minutesPerDay(logs, weekStart)`, `streaks(logs)`, `monthTotals(logs, month)`. Use `date-fns` (already installed).
4. Loading: reuse the logs fetch — lift it into a small `useLogs()` hook (`src/lib/useLogs.ts`) shared by Dashboard, Stats, and ExportModal so the three don't triple-fetch.

Acceptance: numbers agree with Dashboard totals; chart renders correctly across week boundaries and empty weeks.

## Phase 5 — Goal progress upgrade (builds on existing target-hours code)

1. Replace the linear bar in `TotalHoursCard` (Dashboard) with a **progress ring** (SVG circle, animated stroke-dashoffset) showing % complete, hours logged, hours left.
2. Add **projected finish date**: `remainingHours / avgHoursPerWorkedDay` (from `stats.ts`, last 30 days of completed logs) → "On pace to finish ~Aug 21". Hide if fewer than 5 completed logs.
3. Milestone moments: at 25/50/75%, show a one-time toast ("Halfway there! 🎉") using the same localStorage-key pattern as the existing 100% `CelebrationModal` (`ojt-celebrated:{user}:{target}`).
4. Keep the existing `CelebrationModal` at 100% unchanged.

Acceptance: ring animates on load, projection sane with sparse data, milestones fire once.

## Phase 6 — Forgot-to-clock-out handling

Problem: an `active` log from a previous day stays open forever with no way to close it (ClockOut flow only targets today's log).

1. Detection: in `useLogs()` (or Dashboard), find `logs.filter(l => l.status === 'active' && l.work_date < todayDateStr())`.
2. New `StaleSessionModal` shown on Dashboard load when found: "Looks like you forgot to clock out on **Tue, Jul 1**." Fields: end **time** picker (constrained: after `clock_in_at`, within that same `work_date`, max e.g. 16 h shift), optional note. Default suggestion: clock-in + typical day length (avg from stats, fallback 8 h).
3. Save: update the log with `clock_out_at`, `status: 'completed'`, and append `"(closed manually)"` to `clock_out_notes`. Handle multiple stale logs sequentially (rare, but the unique-per-day index means it's a short list).
4. Also let users open the same editor from `LogDetailModal` for any stale active log ("Close this session" button).
5. Guard rail going forward: in the ActiveCard timer, if elapsed > 16 h, swap the live timer text for a "Still working? Close your session" prompt.

No schema change needed. Acceptance: stale log can be closed with a plausible time; duration math and exports treat it like any completed log.

## Phase 7 — Iconography & personalized assets

1. lucide-react stays as the single icon library. Standardize: create `src/components/Icon.tsx` wrapper or just a convention — `strokeWidth={2.25}`, sizes from a fixed scale (13/15/18/22/26), and document it in the README.
2. **Custom SVG illustration set** (hand-drawn-feel, on the pastel palette, using CSS-variable fills so they re-theme automatically). Create `src/components/illustrations/` with React SVG components for: empty-logs state (sleepy clock mascot ☁️), celebration modal, onboarding steps (3), permissions page, and login hero. Replace the current lucide-icon-in-a-circle placeholders (e.g. `Coffee` empty state in Dashboard).
3. Establish a simple mascot: a round clock character with a face — reuse across empty states/celebration for personality. Keep each SVG < 8 KB, no external images.
4. Refresh PWA icons (`public/pwa-192/512.png`, `apple-touch-icon.png`, `favicon.svg`) to feature the mascot/wordmark consistently.

Acceptance: no raster illustration assets added to the bundle; illustrations recolor with theme.

## Phase 8 — UI fidelity & UX polish

UI (staying on the soft/pastel identity):

1. **Skeleton loaders** instead of spinners on Dashboard/Stats (shimmering card placeholders — a `shimmer` keyframe already exists in `tailwind.config.js`, unused).
2. Motion polish: `layout` animations on the log list (delete slides remaining rows up), spring on modals (already partially there), stagger caps kept as-is. Respect `prefers-reduced-motion` — wrap framer-motion defaults with `useReducedMotion()`.
3. Consistency pass: one radius scale (2xl/3xl/4xl only), one shadow scale (soft/card), unify the three gradient hero cards' padding/typography in Dashboard.
4. Subtle depth: 1px inner border highlight on cards (`border-white/70` exists — keep), slightly stronger pressed states.

UX:

5. **Refetch on focus/visibility** (`visibilitychange` in `useLogs()`) so reopening the PWA shows fresh data; keep the existing midnight-rollover interval.
6. **Undo-delete toast** instead of hard confirm: replace `ConfirmModal` for log delete with immediate optimistic removal + 5 s "Log deleted — Undo" toast (restore on undo, commit delete after timeout). Keep confirm modals for sign-out and workplace change.
7. Clock-in friction: on Dashboard idle card, show distance-to-workplace hint *before* the user taps clock in (reuse `src/lib/geo.ts`; only if permission already granted — never prompt from the dashboard).
8. Error/empty states: offline banner (listen to `online`/`offline`), retry button on failed loads instead of toast-only.
9. Accessibility: focus-visible rings on all interactive elements (`focus:ring` exists on inputs only), `aria-label`s on icon-only buttons (export, delete, tab icons), minimum 44px touch targets in the tab bar.
10. Haptics: `navigator.vibrate(10)` on clock-in/out success (feature-detected).

## Suggested order & sizing

| Phase | Size | Depends on |
|---|---|---|
| 1 Token refactor | M | — |
| 2 Themes + dark | M | 1 |
| 3 XLSX export | M | — (parallel-safe) |
| 4 Stats tab | M | useLogs hook |
| 5 Goal upgrade | S | 4 (stats.ts) |
| 6 Stale sessions | S | useLogs hook |
| 7 Icons/assets | M | 2 (variable fills) |
| 8 Polish | M | best done last |

## Out of scope (deliberately)

- Editing past log times/notes (beyond closing stale sessions) — revisit later.
- Multiple workplaces, supervisor sign-off/PDF reports, offline queueing of clock-ins.
- Chart library, state-management library, component library — not needed at this size.

## Verification checklist (every phase)

- `npm run build` passes (runs `tsc --noEmit` first).
- Manual smoke: login → dashboard → clock in → clock out → export → theme switch → dark mode → stats.
- No new console errors; Lighthouse PWA check still passes after Phases 2 & 7 (manifest/icons touched).
