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
export async function checkA11y(page: Page, selector = '#root'): Promise<void> {
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
      .map((v) => `${v.id} (${v.impact}): ${v.help}\n  ${v.nodes.map((n) => n.html).join('\n  ')}`)
      .join('\n\n')
  ).toEqual([]);
}
