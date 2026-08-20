import { test, expect } from '@playwright/experimental-ct-react';
import { SettingsMenu } from './SettingsMenu';
import { checkA11y } from '../../../playwright/a11y';
import type { SettingsSchema } from './types';

// SettingsMenu is where the "selected" state layer has to read as
// distinct from plain hover — the changelog records a period where the
// active nav row and a hovered row used the *same* token, which makes
// the current category impossible to identify at a glance. That
// distinction is purely a resolved-CSS fact, so it belongs here rather
// than in a jsdom test.

const schema: SettingsSchema = {
  categories: [
    {
      id: 'general',
      label: 'General',
      fields: [
        { key: 'name', type: 'text', label: 'Display name' },
        { key: 'autosave', type: 'boolean', label: 'Auto-save' },
      ],
    },
    {
      id: 'appearance',
      label: 'Appearance',
      fields: [
        {
          key: 'theme',
          type: 'choice',
          label: 'Theme',
          options: [
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
          ],
        },
      ],
    },
  ],
};

const values = {
  general: { name: 'Nick', autosave: true },
  appearance: { theme: 'dark' },
};

function Fixture() {
  return (
    <div style={{ height: 400 }}>
      <SettingsMenu schema={schema} values={values} onChange={() => {}} />
    </div>
  );
}

test.describe('nav row states', () => {
  test('the current category reads differently from a hovered one', async ({
    mount,
  }) => {
    const component = await mount(<Fixture />);

    const current = component.getByRole('button', { name: /General/ });
    const other = component.getByRole('button', { name: /Appearance/ });

    const currentBackground = await current.evaluate(
      (el) => getComputedStyle(el).backgroundColor
    );

    await other.hover();
    const hoveredBackground = await other.evaluate(
      (el) => getComputedStyle(el).backgroundColor
    );

    // Both are "lit", but at different rungs of the state ladder —
    // equality here is the exact regression this test exists for.
    expect(currentBackground).not.toBe(hoveredBackground);
    expect(currentBackground).not.toBe('rgba(0, 0, 0, 0)');
  });

  test('a resting, non-current row carries no state layer', async ({ mount }) => {
    const component = await mount(<Fixture />);
    const other = component.getByRole('button', { name: /Appearance/ });
    const background = await other.evaluate(
      (el) => getComputedStyle(el).backgroundColor
    );
    expect(background).toBe('rgba(0, 0, 0, 0)');
  });

  test('marks the current category with aria-current, not colour alone', async ({
    mount,
  }) => {
    const component = await mount(<Fixture />);
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
    const component = await mount(<Fixture />);
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
    const component = await mount(<Fixture />);

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
    const component = await mount(<Fixture />);
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

test.describe('accessibility', () => {
  test('the settings surface has no axe violations', async ({ mount, page }) => {
    await mount(<Fixture />);
    await checkA11y(page);
  });

  test('the category list is exposed as a labelled navigation landmark', async ({
    mount,
  }) => {
    const component = await mount(<Fixture />);
    await expect(
      component.getByRole('navigation', { name: 'Settings categories' })
    ).toBeVisible();
  });
});
