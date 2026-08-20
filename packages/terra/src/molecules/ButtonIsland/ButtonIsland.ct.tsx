import { test, expect } from '@playwright/experimental-ct-react';
import { ButtonIsland } from './ButtonIsland';
import { Button } from '../../atoms/Button';

// Regression test for this session's real bug: --stella-state-hover and
// --stella-border-default resolved to the identical raw value, so the
// auto-inserted separator's hover escalation was a no-op — it changed
// color "to" the color it already rested at. jsdom can't catch this
// (no real getComputedStyle cascade over :has()); a real browser can.

test('separator between two buttons changes color on hover', async ({ mount }) => {
  const component = await mount(
    <ButtonIsland>
      <Button>Left</Button>
      <Button>Right</Button>
    </ButtonIsland>
  );

  const separator = component.getByRole('separator');
  const restingColor = await separator.evaluate((el) => getComputedStyle(el).backgroundColor);

  await component.getByRole('button', { name: 'Left' }).hover();
  const hoveredColor = await separator.evaluate((el) => getComputedStyle(el).backgroundColor);

  expect(hoveredColor).not.toBe(restingColor);
});

test('outer Island border changes color on button hover', async ({ mount }) => {
  const component = await mount(
    <ButtonIsland>
      <Button>Left</Button>
      <Button>Right</Button>
    </ButtonIsland>
  );

  const island = component; // Island is the mounted root element
  const restingColor = await island.evaluate((el) => getComputedStyle(el).borderColor);

  await component.getByRole('button', { name: 'Left' }).hover();
  const hoveredColor = await island.evaluate((el) => getComputedStyle(el).borderColor);

  expect(hoveredColor).not.toBe(restingColor);
});
