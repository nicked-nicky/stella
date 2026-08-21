# Contributing to Stella

Stella is a personal-identity project — the author uses it to build their own desktop apps and releases it open source. That shapes how contributions work: functional fixes, accessibility improvements, bug reports, and new components that fit the existing patterns are very welcome; visual-identity decisions (radius, spacing, motion, color, "does this look like libadwaita") are the maintainer's call, since the whole point of the kit is a specific, opinionated look. When in doubt, open an issue to discuss before writing code — see [Before you start](#before-you-start).

## Before you start

- **Bug fixes, a11y fixes, docs fixes:** just send a PR.
- **New component or prop:** open an issue first describing the use case. Saves you writing something that doesn't fit `Terra stays thin` or the atomic-design structure.
- **Visual changes:** open an issue first. "Does this match libadwaita" is a judgment call the maintainer needs to make directly.
- Read [WIKI.md](./WIKI.md) — specifically [Component structure & conventions](./WIKI.md#component-structure--conventions) — before writing a new component. It covers file layout, when to split a component into multiple files, and the CSS/token conventions every component follows.

## Development setup

```bash
pnpm install
pnpm typecheck
pnpm test                                  # Vitest
pnpm --filter @stella/terra test:ct        # Playwright (needs `playwright install chromium` once)
```

The live showcase (`packages/terra-test`) is a **separate repository** and is gitignored here, so `pnpm dev` won't have anything to run on a fresh clone — the test suites are your feedback loop instead. Full dev workflow (build, test, format) is in [WIKI.md → How to develop](./WIKI.md#how-to-develop).

## Code style

- Prettier is authoritative — run `pnpm format` before committing. `.tsx`/`.ts` files use spaces + single quotes (an override in `.prettierrc`); everything else uses tabs + double quotes. `pnpm format:check` runs in CI-equivalent mode if you want to check without writing.
- TypeScript strict mode is on (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`). Don't relax these for a single file — fix the type instead.
- No new dependency in `@stella/terra` without a strong reason — the default answer to "should we add this" is no. If your change genuinely needs one, say why in the PR description (bundle size cost, what it replaces, why a small hand-rolled version isn't enough) and expect it to be a bigger discussion than the rest of the change.
- CSS Modules only. No inline styles for anything that should vary by theme — that's what the design tokens in `tokens.css` are for. Cross-file CSS sharing uses `composes:`, not copy-paste.

## Accessibility

Not optional, not an opt-in prop. If you're adding an interactive component:

- Use the native HTML element if one exists (`<input>`, `<button>`) before reaching for a custom `role`.
- Keyboard navigation has to work — Tab, and whatever the native/ARIA pattern for that role expects (arrow keys for a roving-tabindex list, Space/Enter for a button-like control).
- `:focus-visible` needs a real, visible ring. Check whether your component lives inside a `clip`-on `Island` — if so it needs an inset ring (`outline-offset: -2px`), not outset, or the wrapping pill will clip it.

## Tests

See [WIKI.md → Testing](./WIKI.md#testing) for what belongs in a Vitest unit test vs. a Playwright component test. Rough rule: if the behavior lives in JS/TSX logic (state, event handlers, ARIA attributes), it's a `.test.tsx`. If the behavior lives in actual CSS (a color that should change on hover/press, a `:has()` reaction), it's a `.ct.tsx` — jsdom can't verify real computed styles, so a unit test asserting a CSS rule _exists_ doesn't actually prove it _works_.

New components/props should come with at least one test of whichever kind is relevant. Bug fixes for a real regression (like a CSS token collision that silently broke a hover state) should come with a test that would have caught it — see `ButtonIsland.ct.tsx` for the pattern.

## Commits & PRs

- Commit messages: short imperative summary line (`Fix Button focus ring`, not `Fixed` or `Fixing`), body if the _why_ isn't obvious from the diff.
- One logical change per PR. A component fix and an unrelated README tweak are two PRs.
- Update `CHANGELOG.md` under `[Unreleased]` for anything user-facing (new component, prop, bug fix, breaking change) — see existing entries for the level of detail expected: what changed and _why_, not just what.
- If your change affects a documented pattern, update [WIKI.md](./WIKI.md) in the same PR. Docs drifting out of sync with the code is worse than no docs.

## Reporting issues

Include: what you expected, what happened, a minimal reproduction (a snippet is usually enough — this isn't a large app, most bugs reproduce in a few lines). For visual bugs, a screenshot; for keyboard/a11y bugs, which keys you pressed and what should have happened.

## License

By contributing, you agree your contribution is licensed under the project's [MIT license](./LICENSE).
