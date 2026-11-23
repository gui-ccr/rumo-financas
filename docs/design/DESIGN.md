# Rumo — Design contract

Source kit: Brankas (see `BRANKAS.md`), adapted: **lime accent → Rumo indigo/periwinkle**.
Mode: **Operate** (task app). Dark is the default identity; light is the alternate (Ajustes → Aparência).
Feel: mature, graphite, quiet; one bright accent spent sparingly; numbers in mono.

## Tokens (never hardcode hex in screens)
| Use | Class | Notes |
|---|---|---|
| Screen bg | `bg-background` | #121212 dark / #FFF light |
| Grouped content, tiles | `bg-card` or `<Surface>` | #1D1D1F / #F2F2F4, no border |
| Controls, chips, icon circles | `bg-muted` | #2A2A2D / #F2F2F4 |
| Text | `text-foreground`, `text-muted-foreground` | never gray hex |
| Filled CTA | `<Button>` (indigo, lavender label) | |
| Accent | `bg-accent` / `text-accent` | active state, focus, chart highlight, center tab. ≤1 accent block per screen |
| Money in/out | `text-income` / `text-expense`, soft bg `bg-income-soft` / `bg-expense-soft` | |
| Warning | `text-warning`, `bg-warning-soft` | |
| Inactive icons | `colors.iconMuted` | |
| Dividers | `border-border` hairline, inset | |
JS colors (icons, gradients): `useThemeColors()` from `@/shared/ui/theme`. Dark check: `useIsDark()`.

## Type
- UI: Plus Jakarta Sans via `<Text variant>`: `display` 44, `title` 28, `heading`/`section` 17 semibold, default 15, `label`/`muted` 13, `caption` 12.
- **All money and numbers: Geist Mono** — use `<Money>` or `font-mono` / `font-mono-medium` / `font-mono-semibold`. Never `font-sans-bold` for figures.
- No eyebrow/kicker labels above headings. Sentence case.

## Shape & spacing
- Screen gutter **20** (`px-5`, Screen does it). Section gap 28 (`gap-7`).
- Radii: badges `rounded-sm`(6), controls `rounded-md`(12), inputs/tiles `rounded-lg`(18), cards `rounded-xl`(24), sheets 36, **buttons/chips/icon buttons `rounded-full`**.
- List rows 64 tall, 40pt round leading icon (`CategoryBadge`/`IconTile` are round now).
- Main CTA: `<Button size="lg">` (54, pill), full width at the bottom of forms.
- Depth: dark = tone steps (background → card → muted), no shadows. Light = `elevation.card` only on `Surface tone="raised"`.

## Components (src/shared/ui)
`Screen`, `HeaderIconButton` (round), `ModalHeader` (round close, centered title), `Surface` (`plain` | `raised` hero gradient, one per screen | `brand` indigo), `Pill` (status chip), `ListSection`/`ListRow`, `Segmented` (pill, ink thumb), `Chip` in form.tsx (pill, selected = ink), `Input`/`MoneyInput` (54/64 tall, focus = accent border), `Money`, `Sheet` (@gorhom bottom sheet, radius 36), `EmptyState`, `Skeleton`, `ErrorNote`.

## Rules
- Prefer `Sheet` (bottom sheet) for short confirmations/pickers instead of full-screen modals.
- Don't nest cards. Don't add gradients, glass, glows or decorative shadows beyond `Surface`.
- Icons: lucide only, stroke 1.7–2, 20–24pt.
- Pressed states: `active:opacity-70` (or `active:bg-muted` on transparent rows).
- Accessibility: keep labels/roles; text contrast ≥ 4.5:1 (tokens already pass).
