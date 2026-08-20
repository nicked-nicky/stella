import { test, expect } from '@playwright/experimental-ct-react';
import { Button } from './Button';
import { ButtonIsland } from '../../molecules/ButtonIsland';
import { checkA11y } from '../../../playwright/a11y';

// Button's entire visual identity is a three-rung state-layer ladder —
// hover → press → selected — over a surface it inherits from the
// wrapping Island. Every rung is a CSS custom property, and the bug
// class this file exists to catch is two of them silently resolving to
// the same value: the ladder collapses, the button stops responding
// visibly, and no jsdom test can see it because jsdom never resolves a
// cascade. This is the same failure that ButtonIsland.ct.tsx was written
// for, one level down.
//
// Also covers the focus ring, which the changelog records as having been
// entirely absent (`outline: 0`) at one point despite the component's
// own docblock promising it.

/** Resolves a design token to its computed value on the document root. */
async function token(page: import('@playwright/test').Page, name: string) {
  return page.evaluate(
    (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim(),
    name
  );
}

test.describe('state-layer ladder', () => {
  test('the three state tokens resolve to three distinct values', async ({
    mount,
    page,
  }) => {
    // Asserted at the token level as well as the rendered level: if these
    // ever collide again, this failure names the cause directly instead
    // of just reporting that a hover looked the same as a press.
    await mount(
      <ButtonIsland>
        <Button>Save</Button>
      </ButtonIsland>
    );

    const hover = await token(page, '--stella-state-hover');
    const active = await token(page, '--stella-state-active');
    const selected = await token(page, '--stella-state-selected');

    expect(hover).not.toBe('');
    expect(new Set([hover, active, selected]).size).toBe(3);
  });

  test('rest state carries no surface of its own', async ({ mount }) => {
    // Button borrows the Island's tone — a fill here would mean it had
    // stopped doing that.
    const component = await mount(
      <ButtonIsland>
        <Button>Save</Button>
      </ButtonIsland>
    );
    const button = component.getByRole('button', { name: 'Save' });
    const background = await button.evaluate(
      (el) => getComputedStyle(el).backgroundColor
    );
    expect(background).toBe('rgba(0, 0, 0, 0)');
  });

  test('hover paints a state layer and brightens the label', async ({ mount }) => {
    const component = await mount(
      <ButtonIsland>
        <Button>Save</Button>
      </ButtonIsland>
    );
    const button = component.getByRole('button', { name: 'Save' });

    const restColor = await button.evaluate((el) => getComputedStyle(el).color);
    await button.hover();

    const hoverBackground = await button.evaluate(
      (el) => getComputedStyle(el).backgroundColor
    );
    const hoverColor = await button.evaluate((el) => getComputedStyle(el).color);

    expect(hoverBackground).not.toBe('rgba(0, 0, 0, 0)');
    expect(hoverColor).not.toBe(restColor);
  });

  test('press escalates beyond hover rather than repeating it', async ({
    mount,
    page,
  }) => {
    const component = await mount(
      <ButtonIsland>
        <Button>Save</Button>
      </ButtonIsland>
    );
    const button = component.getByRole('button', { name: 'Save' });

    await button.hover();
    const hoverBackground = await button.evaluate(
      (el) => getComputedStyle(el).backgroundColor
    );

    await page.mouse.down();
    const pressBackground = await button.evaluate(
      (el) => getComputedStyle(el).backgroundColor
    );
    await page.mouse.up();

    expect(pressBackground).not.toBe(hoverBackground);
  });

  test('the selected state out-specifies hover, so it does not flicker while hovered', async ({
    mount,
  }) => {
    // The CSS repeats .active across :hover/:active precisely to win the
    // specificity fight — easy to lose in a refactor, invisible without
    // a real cascade.
    const component = await mount(
      <ButtonIsland>
        <Button active>Editor</Button>
      </ButtonIsland>
    );
    const button = component.getByRole('button', { name: 'Editor' });

    const restBackground = await button.evaluate(
      (el) => getComputedStyle(el).backgroundColor
    );
    await button.hover();
    const hoverBackground = await button.evaluate(
      (el) => getComputedStyle(el).backgroundColor
    );

    expect(hoverBackground).toBe(restBackground);
  });

  test('a selected button reads differently from a merely hovered one', async ({
    mount,
  }) => {
    const component = await mount(
      <ButtonIsland>
        <Button active>Editor</Button>
        <Button>Settings</Button>
      </ButtonIsland>
    );

    const selected = component.getByRole('button', { name: 'Editor' });
    const plain = component.getByRole('button', { name: 'Settings' });

    const selectedBackground = await selected.evaluate(
      (el) => getComputedStyle(el).backgroundColor
    );
    await plain.hover();
    const hoveredBackground = await plain.evaluate(
      (el) => getComputedStyle(el).backgroundColor
    );

    expect(selectedBackground).not.toBe(hoveredBackground);
  });

  test('a disabled button does not respond to hover', async ({ mount }) => {
    const component = await mount(
      <ButtonIsland>
        <Button disabled>Save</Button>
      </ButtonIsland>
    );
    const button = component.getByRole('button', { name: 'Save' });

    const restBackground = await button.evaluate(
      (el) => getComputedStyle(el).backgroundColor
    );
    await button.hover({ force: true });
    const hoverBackground = await button.evaluate(
      (el) => getComputedStyle(el).backgroundColor
    );

    expect(hoverBackground).toBe(restBackground);
  });
});

test.describe('focus ring', () => {
  test('draws a visible ring on keyboard focus', async ({ mount, page }) => {
    // Regression test for the changelog's "Button had no visible focus
    // ring" — it set outline: 0 and was the only interactive component
    // in the kit with no keyboard indicator.
    const component = await mount(
      <ButtonIsland>
        <Button>Save</Button>
      </ButtonIsland>
    );
    const button = component.getByRole('button', { name: 'Save' });

    await page.keyboard.press('Tab');
    await expect(button).toBeFocused();

    const outline = await button.evaluate((el) => {
      const s = getComputedStyle(el);
      return {
        style: s.outlineStyle,
        width: s.outlineWidth,
        color: s.outlineColor,
      };
    });

    expect(outline.style).not.toBe('none');
    expect(outline.width).toBe('2px');
    expect(outline.color).not.toBe('rgba(0, 0, 0, 0)');
  });

  test('draws the ring inset, so the Island’s clip cannot swallow it', async ({
    mount,
    page,
  }) => {
    // Island sets overflow: hidden; an outset ring would be clipped away
    // and effectively invisible inside a linked button group.
    const component = await mount(
      <ButtonIsland>
        <Button>Save</Button>
      </ButtonIsland>
    );
    const button = component.getByRole('button', { name: 'Save' });

    await page.keyboard.press('Tab');
    const offset = await button.evaluate(
      (el) => getComputedStyle(el).outlineOffset
    );
    expect(offset).toBe('-2px');
  });
});

test.describe('accessibility', () => {
  test('a button group has no axe violations', async ({ mount, page }) => {
    await mount(
      <ButtonIsland>
        <Button active>Editor</Button>
        <Button>Settings</Button>
      </ButtonIsland>
    );
    await checkA11y(page);
  });

  test('an icon-only button still exposes an accessible name', async ({
    mount,
    page,
  }) => {
    // The icon span is aria-hidden, so without an explicit aria-label
    // this button would be announced as unlabelled — axe catches it.
    await mount(
      <ButtonIsland>
        <Button iconOnly aria-label="Close">
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" fill="none" />
          </svg>
        </Button>
      </ButtonIsland>
    );
    await checkA11y(page);
  });
});
