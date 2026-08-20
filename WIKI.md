# Stella Wiki

Everything about developing Stella, using its components, and why things are built the way they are. Start here; jump to [CONTRIBUTING.md](./CONTRIBUTING.md) when you're ready to send a change.

## Contents

1. [Orientation](#orientation)
2. [How to develop](#how-to-develop)
3. [How to use components](#how-to-use-components)
4. [Component structure & conventions](#component-structure--conventions)
5. [Architecture reference](#architecture-reference)
6. [Testing](#testing)
7. [Known gaps](#known-gaps)

---

## Orientation

Stella is two packages: `@stella/terra` (the base — thin, functional, GTK 4/libadwaita-inspired) and `@stella/vidrio` (an aesthetic superset of Terra — frosted glass, dynamic lighting; scaffolded, not built yet). Terra never depends on Vidrio; that direction is fixed.

Repo layout:

```
packages/
  terra/       @stella/terra  — the package you install
  vidrio/      @stella/vidrio — depends on @stella/terra via workspace:*
  terra-test/  Vite + React app: local dev loop + living component showcase
```

Every component follows atomic design: `src/atoms/`, `src/molecules/`, `src/organisms/`, `src/layout/`, plus `src/providers/` and `src/theme/` for app-level systems.

## How to develop

**Prerequisites:** Node ≥ 20, pnpm.

```bash
pnpm install
pnpm dev   # runs terra-test — a Vite app consuming @stella/terra live via workspace:*
```

Terra's `src/` is consumed directly by `terra-test` through the pnpm workspace, so editing a component hot-reloads immediately — no build step in the loop. `pnpm dev` is where you'll do almost all component work.

This works because `@stella/terra`'s `exports` point at `./src/index.ts`, and `publishConfig` overrides them to `./dist/` — pnpm swaps the two at publish time, so workspace consumers get live source and published consumers get compiled output, with no build step in between and no `dist/` needing to exist locally. (It previously pointed only at `dist/`, which meant `pnpm dev` failed with *"Failed to resolve entry for package @stella/terra"* on a clean checkout, since `dist/` is gitignored and never built in the dev loop.)

**Build** (only needed to actually publish — not part of the dev loop):

```bash
pnpm --filter @stella/terra build
```

Terra builds unbundled: `tsc` compiles `src/` to `dist/` 1:1 (declarations included), then `scripts/copy-css.mjs` copies every `*.css`/`*.module.css` alongside its compiled `.js` twin, since `tsc` only touches TypeScript. No bundler in the middle — the consuming app's own bundler (Vite, webpack, Next, a Tauri frontend) resolves the CSS Modules imports from `dist/`, the same way it already resolves them from any other package. This keeps Terra genuinely thin (zero build-tool dependency shipped or required beyond `tsc`) and gives perfect tree-shaking for free, since there's no bundler decision-making step to get in the way of dead-code elimination.

The tradeoff: `dist/` output uses extensionless relative imports (`from '../atoms/Button'`), which needs a bundler to resolve — running the built output under plain Node ESM directly won't work. Every realistic Stella consumer (Vite, webpack, Next, Tauri) already has one, so this hasn't been a real constraint.

**Typecheck:**

```bash
pnpm typecheck   # runs tsc in every package
```

Terra has two TS configs, and the split matters: `tsconfig.json` is the **build** config (emits `dist/`, excludes `*.test.*`/`*.ct.tsx` so tests never ship), while `tsconfig.typecheck.json` is the **check** config (`noEmit`, and additionally covers the test files, `playwright/`, and the config files themselves). `pnpm typecheck` runs the second. Without the split, `pnpm build` would emit compiled test files into `dist/` and fail on `playwright/a11y.ts` sitting outside `rootDir`.

**Format:**

```bash
pnpm format         # writes
pnpm format:check   # CI-style check, no writes
```

Prettier config: tabs + double quotes everywhere, **except** `*.{ts,tsx}` which override to spaces + single quotes (see `.prettierrc`). If a `.tsx` file looks tab-indented with double quotes, it predates that override and is due a reformat, not a new convention to match.

**Test:** see [Testing](#testing) below.

**Publish checklist** (manual, no Changesets):

1. Bump `version` in `packages/terra/package.json` — semver: patch for fixes, minor for new components/props, major for breaking API/behavior changes. Pre-1.0, minor can carry breaking changes too (standard semver-0.x reading).
2. Add an entry to the root `CHANGELOG.md` under a new version heading, moving anything relevant out of `[Unreleased]`.
3. `pnpm --filter @stella/terra build` — note this emits `dist/`, which `publishConfig` repoints `exports`/`main`/`types` at automatically. Nothing in `package.json` needs hand-editing for that; `pnpm publish` does the swap.
4. Flip `"private": true` → remove it (or set `false`) in `packages/terra/package.json` when actually ready to publish — it's left `true` deliberately so `npm publish` can't happen by accident.
5. `pnpm --filter @stella/terra publish --access public` (the `publishConfig.access: "public"` field already covers this, `--access public` is belt-and-suspenders for the scoped-package default).
6. Tag the release in git.

## How to use components

Once published:

```bash
pnpm add @stella/terra
```

Import the design tokens once, at your app's entry point — everything else in Terra reads these as CSS custom properties, nothing works visually without them:

```tsx
import '@stella/terra/styles/tokens.css';
```

Wrap your app root in the providers you need — none are required for a component to render, but `ThemeProvider` is needed for runtime theme switching, `OverlayProvider` for `Dialog`/`Menu`/`Popover`, `NotificationProvider` for toasts:

```tsx
import { ThemeProvider, OverlayProvider, NotificationProvider } from '@stella/terra';

function Root() {
  return (
    <ThemeProvider>
      <OverlayProvider>
        <NotificationProvider>
          <App />
        </NotificationProvider>
      </OverlayProvider>
    </ThemeProvider>
  );
}
```

Then use components directly:

```tsx
import { ButtonIsland, Button } from '@stella/terra';

<ButtonIsland size="sm">
  <Button>Cancel</Button>
  <Button active>Save</Button>
</ButtonIsland>
```

**Worked example — `SettingsMenu`** (data-driven, schema in, changes out — it owns no state of its own beyond which category is selected):

```tsx
import { useState } from 'react';
import { SettingsMenu, type SettingsSchema, type SettingsValues } from '@stella/terra';

const schema: SettingsSchema = {
  categories: [
    {
      id: 'general',
      label: 'General',
      fields: [
        { key: 'displayName', type: 'text', label: 'Display name' },
        { key: 'autoSave', type: 'boolean', label: 'Auto-save' },
        {
          key: 'startupView',
          type: 'choice',
          label: 'Startup view',
          options: [
            { value: 'dashboard', label: 'Dashboard' },
            { value: 'last', label: 'Last opened' },
          ],
        },
      ],
    },
  ],
};

function Settings() {
  const [values, setValues] = useState<SettingsValues>({
    general: { displayName: 'Jane', autoSave: true, startupView: 'dashboard' },
  });

  return (
    <SettingsMenu
      schema={schema}
      values={values}
      onChange={(categoryId, key, value) =>
        setValues((prev) => ({ ...prev, [categoryId]: { ...prev[categoryId], [key]: value } }))
      }
    />
  );
}
```

For the full component list and prop reference, generated API docs are the source of truth (TypeDoc — see [Testing/Docs](#how-to-develop)); this wiki covers usage patterns and reasoning, not a live prop table that would drift out of sync.

## Component structure & conventions

**Per-component file layout**, one folder per component under its atomic-design tier:

```
atoms/Button/
  Button.tsx
  Button.module.css
  index.ts        — barrel: export { Button, type ButtonProps, ... } from './Button';
```

`index.ts` only ever re-exports; it never contains logic. `src/index.ts` at the package root re-exports every component's barrel — that single file is Terra's entire public surface.

**When a component outgrows one file**, split by sub-component, not by concern (no generic `utils.ts`/`helpers.ts` dumping ground). `SettingsMenu` is the reference example:

```
organisms/SettingsMenu/
  SettingsMenu.tsx           — root: composition + controlled/uncontrolled state
  SettingsCategoryPanel.tsx  — internal: right-hand pane
  SettingsNav.tsx            — internal: left-hand category list
  fields/
    SettingsFieldRow.tsx     — internal: dispatches on field.type
    BooleanField.tsx
    ChoiceField.tsx
    TextField.tsx
  types.ts                   — schema types (SettingsSchema, SettingsField, ...)
  index.ts                   — still only exports SettingsMenu + its public types
```

Only the root component (`SettingsMenu`) is exported from the barrel. Everything else is `// internal — decomposition detail, not a new atom` in its own docblock, so nobody mistakes an internal split for a new part of the public API. Split when a file mixes more than one real responsibility (nav vs. panel vs. per-field-type rendering) or crosses roughly 150–200 lines of actual logic — not on a fixed line count alone.

**Compound vs. prop-driven APIs:** complex organisms use compound components (`<Dialog><Dialog.Header>…`), simple atoms stay prop-driven (`<Button variant="…">`). If a component has 2+ structurally distinct regions a consumer composes (header/body/footer), reach for compound; if it's one control with variations, reach for props.

**CSS:** CSS Modules only, zero runtime CSS-in-JS. Cross-file sharing uses `composes: x from './file.module.css'` (see `styles/shared/formControl.module.css`, `styles/shared/controlIcon.module.css`) rather than duplicating declarations. All theming is CSS custom properties (`tokens.css`) — never JS-computed inline styles for anything that varies by theme, so an accent/density/radius change never forces a React re-render.

**Accessibility:** native HTML element first (`<input type="checkbox">`, real `<button>`) — custom ARIA wiring (`role="switch"`, roving tabindex) only when no native element matches, and even then keyboard behavior and focus management are non-optional, not an opt-in prop. `:focus-visible` gets a real ring on every interactive component; see the inset-ring pattern in [Architecture reference](#architecture-reference).

**Icons:** Terra ships no icon set. Symbolic UI glyphs it does need internally (window controls, dialog close) live in `utils/icons.tsx`, one file, no duplication — check there before inlining a new SVG.

## Architecture reference

Deeper design reasoning that used to live as long inline comments scattered across individual component files — relocated here so it's in one searchable place instead of duplicated/drifting per file. Source comments now point back to the relevant section here instead of re-explaining it.

### Design tokens & theming

`ThemeManager` (framework-agnostic) writes CSS custom properties to the document root; `ThemeProvider`/`useTheme` is the React binding. Four independent axes, each backed by a scale token multiplier so changing one updates every component reading it with no re-render:

| Axis | Token | Values |
|---|---|---|
| Color scheme | native `light-dark()` | `light` / `dark` / `system` |
| Radius | `--stella-radius-scale` | `sharp` / `default` / `round` |
| Density | `--stella-space-scale` | `compact` / `default` / `comfortable` |
| Border width | `--stella-border-width` | `none` / `thin` / `default` / `thick` |

**Single radius token model:** every component reads `--stella-radius-panel` for its rounding — there is no per-component radius scale. This was a deliberate consolidation (there used to be `-xs/-sm/-lg/-full/-pill` variants); one token that everything shares means changing the kit's overall "roundedness" is a single edit, and every surface stays visually consistent with every other one at any radius setting.

**State layers** (`--stella-state-hover` / `-active` / `-selected`) are a 3-step escalation ladder used as *background overlays* over whatever surface tone happens to be underneath (card, muted island, toolbar) — this is deliberate: a fixed opaque hover color previously baked in an assumption about what sat underneath it (`--stella-surface-hover` once equalled `--stella-surface-muted`, so hovering anything on a muted surface was invisible). The three steps mirror a hover → active → selected ladder where each is a clear step firmer than the last.

This ladder is reused as a *border-color* escalation too (see Button/ButtonIsland below) — which surfaced a real bug worth recording: `--stella-state-hover` and `--stella-border-default` briefly resolved to the exact same raw neutral step, so anything using state-hover as a border-color escalation above border-default was changing color "to" the color it already rested at — invisible. Fixed by giving `--stella-state-hover` its own step (`neutral-300`/`600`) distinct from `--stella-border-default` (`neutral-200`/`700`) and below `--stella-state-active` (`neutral-400`/`500`). The lesson: a token being visually correct in one context (background wash over a surface) doesn't guarantee it's correct in another (border-color over a border-default resting state) — check the actual resting value it's escalating *from*, not just the token name.

### Island — the structural primitive

`Island` is the one container every surface in Stella builds on: a bordered, elevated box (`panel` shape, block-level, fills its container) or a content-hugging pill (`pill` shape, `ButtonIsland`/toolbar clusters). Both shapes share the same radius token — shape is a layout distinction, not a rounding one. `ButtonIsland`, `Dialog`, `Menu`'s panel, `Notification` are all an `Island` underneath.

### Button / ButtonIsland — the border model

`Button` carries **no border property at all**, and no radius, and no surface of its own — all three come from the wrapping `ButtonIsland`/`Island`. This is deliberate, not an oversight: a bare `Button` outside an `Island` is square and borderless on purpose, a signal to wrap it rather than a bug.

The hairline between adjacent buttons in a `ButtonIsland` is a **real `Divider` element**, auto-inserted between every consecutive `Button` pair by `ButtonIsland.tsx` — not a border trick. (An earlier version used a reserved transparent `border-left` on `Button` colored in via a sibling selector; this was replaced because "buttons shouldn't have borders, Islands do" — border/separator ownership belongs to the container, not the control.) An explicit `ButtonIsland.Separator` already sitting between two buttons is left alone — no second one gets auto-inserted next to it.

Both the auto-inserted hairline and the outer `Island`'s own border react to a hovered/pressed `Button` child via CSS `:has()` — no JS state needed to coordinate a child's interaction with its parent's styling:

```css
.root:has(.group > button:hover:not(:disabled)) { border-color: var(--stella-state-hover); }
.root:has(.group > button:active:not(:disabled)) { border-color: var(--stella-state-active); }
```

`Menu` mirrors this exact pattern for its own items: no border on `.item`, a real auto-inserted `Divider` between adjacent `Menu.Item`s (dimmed one shade via a scoped `.autoSeparator` class since it's a row boundary, not a group break — an explicit `Menu.Separator` stays at the louder default), same `:has()` escalation.

### Focus rings

Inset rings (`outline-offset: -2px`), not outset, on any control that lives inside a `clip`-on `Island` — an outset ring would be clipped by the wrapping pill's `overflow: hidden` and effectively invisible. `Checkbox`/`Radio`/`Switch` (never inside a clipping Island) use outset rings instead.

## Testing

Two layers, deliberately not one — jsdom (what Vitest runs against) doesn't evaluate real CSS: no `:has()`, no `light-dark()`, no real computed-style cascade. A whole class of real bug (the `--stella-state-hover`/`--stella-border-default` collision above) is invisible to a jsdom-based test no matter how thorough, because jsdom never actually paints anything.

**Vitest + Testing Library** (`pnpm --filter @stella/terra test`) — logic, ARIA attributes, controlled/uncontrolled behavior, keyboard event handlers. Colocated as `Component.test.tsx` next to the component. See `Checkbox.test.tsx` and `Switch.test.tsx` for the pattern.

**Playwright component tests** (`pnpm --filter @stella/terra test:ct`) — anything whose correctness lives in actual computed CSS: state-layer escalation, `:has()` reactions, focus ring visibility. Colocated as `Component.ct.tsx`. See `ButtonIsland.ct.tsx` — it's a direct regression test for the hover-collision bug above, asserting `getComputedStyle(...).backgroundColor` actually changes on hover rather than trusting that the CSS rule exists.

**axe-core** (`@axe-core/playwright`, via the shared `checkA11y()` helper in `playwright/a11y.ts`) runs inside the Playwright layer. It complements the hand-written ARIA tests rather than replacing them — axe can't tell you that Escape closes only the topmost overlay, and the hand-written tests can't tell you the focus ring fails contrast. It's a devDependency only, so it never reaches Terra's shipped bundle. Landmark/`lang`/heading rules are disabled in the helper: components are mounted in isolation there, and those are the host application's responsibility.

### What's covered

| Layer | Files | What they protect |
|---|---|---|
| Pure logic | `utils/positioning.test.ts`, `theme/ThemeManager.test.ts` | The anchored-positioning geometry (flip, cross-axis shift, alignment) and the four independent theme axes. No DOM, no React, no flake. |
| Overlay behaviour | `OverlayProvider.test.tsx`, `Dialog.test.tsx`, `Menu.test.tsx` | Escape scoping across stacked layers, Dialog's focus trap and focus restore, Menu's full WAI-ARIA keyboard contract. |
| State & timers | `NotificationProvider.test.tsx` | Queue ordering, auto-dismiss timing, pause-on-hover, the `aria-live` region. |
| Form atoms | `Checkbox`, `Switch`, `Input`, `Radio` `.test.tsx` | Controlled/uncontrolled contracts, ARIA, disabled behaviour. |
| Presentational | `atoms/atoms.smoke.test.tsx` | One file of thin smoke tests for Avatar/Badge/Divider/Spinner/Text/FlexContainer/WindowControls — semantics only. |
| Computed CSS | `ButtonIsland.ct.tsx`, `Button.ct.tsx`, `SettingsMenu.ct.tsx`, `WindowChrome.ct.tsx` | The state-layer ladder resolving to distinct values, focus-ring visibility and inset, the transparent chrome strip, drag regions. |

Priority for anything new, given accessibility is non-negotiable: keyboard navigation, ARIA correctness, and controlled/uncontrolled state for every component that offers both. `Popover` and `Tooltip` are the notable remaining gaps — their positioning is covered indirectly through `positioning.test.ts`, but neither has a component test of its own yet.

## Known gaps

- `@stella/vidrio` is scaffolded, nothing built on top of Terra yet.
- `Popover` and `Tooltip` have no tests of their own — their positioning math is covered by `utils/positioning.test.ts`, but their open/close/anchor behaviour isn't.
- Comment condensing (moving deep design reasoning here, shrinking source docblocks to terse summaries) is in progress, not complete across every component.
- No ESLint config — Prettier only.
- No coverage thresholds enforced in CI. The suite is real now, but nothing stops it from silently getting thinner.
