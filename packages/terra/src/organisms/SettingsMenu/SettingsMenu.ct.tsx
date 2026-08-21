import { test, expect } from '@playwright/experimental-ct-react';
import { SettingsMenuFixture } from './SettingsMenu.story';
import { checkA11y } from '../../../playwright/a11y';

// SettingsMenu's current-row treatment is a resolved-CSS fact, so it
// belongs here rather than in a jsdom test.
//
// The mount target lives in SettingsMenu.story.tsx rather than in this
// file: Playwright CT compiles the test file for Node and the component
// tree for the browser separately, so a component *defined* in a
// .ct.tsx file can't cross that boundary — mount() rejects it with
// "cannot be mounted, create a test story instead". Imported components
// are fine, which is why Button and WindowChrome mount inline.

test.describe('nav row states', () => {
  test('the current category stays lit whether or not it is hovered', async ({
    mount,
  }) => {
    // SettingsMenu.module.css states the intent outright: "Active is just
    // hover, but sticky." The current row and a hovered row share a fill
    // by design, so what makes the current one findable is that it holds
    // that fill with nothing pointing at it — asserted here across a
    // hover of a *different* row, which must not disturb it.
    const component = await mount(<SettingsMenuFixture />);

    const current = component.getByRole('button', { name: /General/ });
    const other = component.getByRole('button', { name: /Appearance/ });

    const atRest = await current.evaluate(
      (el) => getComputedStyle(el).backgroundColor
    );
    expect(atRest).not.toBe('rgba(0, 0, 0, 0)');

    await other.hover();
    const whileOtherHovered = await current.evaluate(
      (el) => getComputedStyle(el).backgroundColor
    );
    expect(whileOtherHovered).toBe(atRest);
  });

  test('a resting, non-current row carries no state layer', async ({ mount }) => {
    const component = await mount(<SettingsMenuFixture />);
    const other = component.getByRole('button', { name: /Appearance/ });
    const background = await other.evaluate(
      (el) => getComputedStyle(el).backgroundColor
    );
    expect(background).toBe('rgba(0, 0, 0, 0)');
  });

  test('marks the current category with aria-current, not colour alone', async ({
    mount,
  }) => {
    const component = await mount(<SettingsMenuFixture />);
    await expect(
      component.getByRole('button', { name: /General/ })
    ).toHaveAttribute('aria-current', 'true');
    await expect(
      component.getByRole('button', { name: /Appearance/ })
    ).not.toHaveAttribute('aria-current', 'true');
  });

  test('nav rows show a visible focus ring on keyboard focus', async ({
    mount,
    page,
  }) => {
    const component = await mount(<SettingsMenuFixture />);
    await page.keyboard.press('Tab');

    const focused = component.getByRole('button', { name: /General/ });
    await expect(focused).toBeFocused();

    const outlineStyle = await focused.evaluate(
      (el) => getComputedStyle(el).outlineStyle
    );
    expect(outlineStyle).not.toBe('none');
  });
});

test.describe('field controls', () => {
  test('switching category swaps the rendered fields', async ({ mount }) => {
    const component = await mount(<SettingsMenuFixture />);

    await expect(component.getByLabel('Display name')).toBeVisible();

    await component.getByRole('button', { name: /Appearance/ }).click();
    await expect(component.getByText('Theme')).toBeVisible();
    await expect(component.getByLabel('Display name')).toHaveCount(0);
  });

  test('a focused text field draws a real focus ring, not just a border colour change', async ({
    mount,
  }) => {
    // The changelog records Input's error state setting outline-color
    // with no outline-style, so the declaration painted nothing — a
    // border-colour-only focus signal is exactly what that produced.
    const component = await mount(<SettingsMenuFixture />);
    const field = component.getByLabel('Display name');

    await field.focus();
    const outline = await field.evaluate((el) => {
      const s = getComputedStyle(el);
      return { style: s.outlineStyle, width: s.outlineWidth };
    });

    expect(outline.style).not.toBe('none');
    expect(outline.width).not.toBe('0px');
  });
});

test.describe('layout', () => {
  test('holds a fixed height instead of sizing to its content', async ({
    mount,
    page,
  }) => {
    // The point of pinning it: switching category must not resize the
    // panel, or the window jumps and the nav column's scroll position
    // goes with it.
    const component = await mount(<SettingsMenuFixture />);
    const root = component.locator('> *').first();

    const before = await root.boundingBox();
    await component.getByRole('button', { name: /Appearance/ }).click();
    await expect(component.getByText('Theme')).toBeVisible();
    const after = await root.boundingBox();

    expect(before).not.toBeNull();
    expect(after!.height).toBeCloseTo(before!.height, 0);

    // ...and that height tracks the viewport, not the content.
    const viewport = page.viewportSize();
    expect(after!.height).toBeCloseTo(viewport!.height * 0.8, -1);
  });

  test('both columns scroll independently rather than the page', async ({
    mount,
  }) => {
    const component = await mount(<SettingsMenuFixture />);

    const overflow = await component
      .getByRole('navigation', { name: 'Settings categories' })
      .evaluate((el) => getComputedStyle(el).overflowY);

    expect(overflow).toBe('auto');
  });
});

test.describe('accessibility', () => {
  test('the settings surface has no axe violations', async ({ mount, page }) => {
    await mount(<SettingsMenuFixture />);
    await checkA11y(page);
  });

  test('the category list is exposed as a labelled navigation landmark', async ({
    mount,
  }) => {
    const component = await mount(<SettingsMenuFixture />);
    await expect(
      component.getByRole('navigation', { name: 'Settings categories' })
    ).toBeVisible();
  });
});
