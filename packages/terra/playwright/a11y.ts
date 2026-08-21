import AxeBuilder from '@axe-core/playwright';
import { expect } from '@playwright/experimental-ct-react';
import type { Page } from '@playwright/test';

/**
 * Shared accessibility assertion for component tests.
 *
 * Runs axe-core against the mounted component and fails with the list of
 * violations if there are any. This is a devDependency only — it never
 * reaches Terra's shipped bundle — and it exists because accessibility
 * is a non-negotiable project principle: hand-written ARIA assertions
 * cover the cases we thought of, axe covers the ones we didn't (contrast
 * ratios, nested-interactive elements, orphaned label references,
 * duplicate ids introduced by a compound component rendering twice).
 *
 * It complements rather than replaces the explicit keyboard/ARIA tests —
 * axe cannot tell you that Escape closes only the topmost overlay, and
 * those tests cannot tell you the focus ring fails contrast.
 *
 * @example
 * ```ts
 * test('is accessible', async ({ mount, page }) => {
 *   await mount(<ButtonIsland><Button>Save</Button></ButtonIsland>);
 *   await checkA11y(page);
 * });
 * ```
 */
/**
 * Waits for entrance animations to finish before anything measures colour.
 *
 * Terra fades components in on mount (`--stella-appear-animation`), and
 * axe computes contrast from *rendered* colour — so an element sampled
 * mid-fade reports its text blended toward the background and fails
 * `color-contrast` for a problem that doesn't exist a few hundred
 * milliseconds later. Both contrast failures on the suite's first green
 * run were this: text-tertiary at ~69% opacity read as #888888 rather
 * than #525252, and text-primary at ~58% read as #777777.
 *
 * Infinite animations are filtered out rather than awaited, because
 * `Spinner`'s rotation never finishes and would hang the run.
 */
async function settleAnimations(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const finite = document.getAnimations().filter((animation) => {
      const iterations = animation.effect?.getComputedTiming().iterations;
      return iterations !== Infinity;
    });
    await Promise.all(
      // A cancelled animation rejects; that's still "settled" for our purposes.
      finite.map((animation) => animation.finished.catch(() => undefined))
    );
  });
}

export async function checkA11y(page: Page, selector = '#root'): Promise<void> {
  await settleAnimations(page);

  const { violations } = await new AxeBuilder({ page })
    .include(selector)
    // Terra components are mounted in isolation here, with no page
    // landmarks, <html lang>, or heading outline around them — those
    // rules are the host application's responsibility, not a component's.
    .disableRules(['region', 'html-has-lang', 'page-has-heading-one'])
    .analyze();

  expect(
    violations,
    violations
      .map(
        (v) =>
          `${v.id} (${v.impact}): ${v.help}\n  ${v.nodes.map((n) => n.html).join('\n  ')}`
      )
      .join('\n\n')
  ).toEqual([]);
}
