# Design System — Holdem Lab

A premium poker study room, not a generic dark dashboard. Deep charcoal foundations, poker-table felt as the primary
brand color, warm ivory for card/content surfaces, restrained brass for merit and emphasis, sparing burgundy for
suits and high-stakes moments. All tokens live in `src/index.css` under `@theme` (Tailwind v4 CSS-first config) and
are consumed as ordinary utility classes (`bg-felt-700`, `text-brass-400`, `rounded-[var(--radius-sm)]`, etc.).

## Color

| Role | Tokens | Use |
|---|---|---|
| Canvas / surfaces | `ink-950` … `ink-500` | Page background, panels, elevated surfaces. Neutral, very slightly warm — never blue-grey. |
| Text | `sand-100` … `sand-600` | Body and secondary text. Warm neutral, not slate. |
| Brand | `felt-900` … `felt-200` | Primary actions, active states, "you" indicators, the table felt itself. |
| Content surfaces | `ivory-100` … `ivory-300` | Playing cards and other surfaces meant to read as physical objects. |
| Accent | `brass-300` … `brass-600` | Merit, currency, the single strongest call-to-action on a page (used sparingly). |
| Stakes / suits | `burgundy-300` … `burgundy-600` | Hearts/diamonds, fold buttons, warnings, loss figures. Sparing by design. |

Only one accent leads at a time: felt for the primary action, brass for the *one* standout element on a page (an
"up next" panel, a recommended lesson). Don't mix the two as equals in the same component.

## Type

- **Display** (`font-display` → Fraunces): major headings only — page heroes, lesson titles, level names. Never body text.
- **Interface** (`font-sans` → IBM Plex Sans, the CSS default): everything else — controls, body copy, labels.
- **Tabular data** (`.tabular` or `font-mono` → IBM Plex Mono / Plex Sans tabular figures): chip counts, percentages,
  odds, timers, EV. Apply the `.tabular` class (or Tailwind's `tabular-nums`, same effect) to any number that sits in
  a column or updates in place, so digits don't shift width.

Scale is controlled, not arbitrary: page titles ~22–30px, section headings ~15–17px, body ~13.5–14.5px, meta text
~11–12px. Reuse `PageHeading` for standard page titles rather than hand-rolling `<h1>` styles.

## Radius

Three steps, used consistently — resist adding a fourth:

- `--radius-xs` (5px): chips, tiny tags, tab pills.
- `--radius-sm` (8px): buttons, inputs, lesson rows, compact cards.
- `--radius-md` (12px): panels, drill cards, level modules.
- `--radius-lg` (18px): page-level hero surfaces only (the Learn hero, the table rail).

## Elevation & borders

Prefer **surface-tone separation** (a panel one shade lighter than its background) and **spacing** over borders.
When a border is unavoidable, use a 1px hairline at low opacity, never a bright accent border around every card.
Shadows (`--shadow-card` / `--shadow-panel` / `--shadow-raised`) always carry an offset and blur — never a
flat/zero-offset colored halo.

## Motion

`--duration-fast` (120ms) for hovers/presses, `--duration-base` (220ms) for panel/state transitions,
`--duration-slow` (420ms) reserved for a dealt-card or chip-to-pot moment. Ease with `--ease-out-expo`. Everything
respects `prefers-reduced-motion` globally (see `index.css`).

## Core components

- `components/common/ui.tsx` — `Panel`, `Button`, `Badge`, `StatTile`, `ProgressBar`, `ReadyState`, `EmptyState`, `Tooltip`.
- `components/common/PageHeading.tsx` — standard page title + subtitle.
- `components/common/CardView.tsx` / `Chip.tsx` / `SuitIcon.tsx` — the physical vocabulary: playing cards with real
  corner indices, poker chips, authored suit glyphs (never emoji).
- `components/common/NavIcons.tsx` — the one icon set used everywhere (stroke-based, consistent weight).
- `components/learn/*` — `LearnHero`, `UpNextPanel`, `LevelModule`, `LessonRow`, `LessonVisual` (the Learn page's
  reference-implementation components; reuse rather than forking).
- `components/table/*` — `PokerTable` (desktop, ≥1024px), `MobileTable` (a purpose-built compact layout for
  <1024px — not a shrunk oval), `Seat`, `ActionBar`, `CoachPanel`.

## Breakpoints

Standard Tailwind scale (`sm` 640, `md` 768, `lg` 1024, `xl` 1280). The poker table specifically switches from the
oval desktop layout to `MobileTable` at `lg` (1024px) because seat cards need real horizontal room to avoid
overlapping — tested and confirmed broken below that width with the oval approach, hence the dedicated layout.

## Honesty conventions (carried over from the product, not just visual)

Numbers are always visually distinguishable by what kind of claim they make: exact math gets plain `tabular` text,
simulation estimates are labelled "(sim.)" / "(estimate)", and heuristic/strategic opinions live in a labelled
"Lesson" or coaching callout — never presented with the same visual confidence as exact arithmetic.
