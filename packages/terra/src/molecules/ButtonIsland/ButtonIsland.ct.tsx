import { test, expect } from '@playwright/experimental-ct-react';
import { ButtonIsland } from './ButtonIsland';
import { Button } from '../../atoms/Button';

// Regression test for this session's real bug: --stella-state-hover and
// --stella-border-default resolved to the identical raw value, so the
// auto-inserted separator's hover escalation was a no-op — it changed
// color "to" the color it already rested at. jsdom can't catch this
// (no real getComputedStyle cascade over :has()); a real browser can.
//
// The stretch tests below are here for the same reason: whether a box
// actually grew is a measured fact about layout, and jsdom reports every
// element as 0×0.

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

test.describe('single-button stretch', () => {
  test('a lone button fills an Island that has been widened', async ({ mount }) => {
    // The chain is three boxes deep — Island, the inner button row, then
    // the Button — and it only takes one of them declining to grow for
    // the whole thing to look broken. The row was the one: it sat at
    // flex-grow: 0, so there was no free space inside it for the
    // Button's `flex: 1` to claim, however wide the Island got.
    const component = await mount(
      <ButtonIsland style={{ width: 400 }}>
        <Button>New note</Button>
      </ButtonIsland>
    );

    const islandBox = await component.boundingBox();
    const buttonBox = await component
      .getByRole('button', { name: 'New note' })
      .boundingBox();

    expect(islandBox).not.toBeNull();
    expect(buttonBox).not.toBeNull();
    // Within the Island's own border on each side.
    expect(buttonBox!.width).toBeGreaterThan(islandBox!.width - 8);
  });

  test('a lone button in an un-widened Island stays at content width', async ({
    mount,
  }) => {
    // The other half of the contract, and the reason this isn't just
    // `width: 100%` on the group: `shape="pill"` is content-sized, so a
    // solo icon button in a toolbar must not suddenly span the row.
    const component = await mount(
      <ButtonIsland>
        <Button>New note</Button>
      </ButtonIsland>
    );

    const box = await component.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeLessThan(200);
  });

  test('a multi-button Island still lays its buttons out at content width', async ({
    mount,
  }) => {
    // Only the single-button case opts into growth; widening a cluster
    // must not silently start stretching every button in it.
    const component = await mount(
      <ButtonIsland style={{ width: 400 }}>
        <Button>Cancel</Button>
        <Button>Save</Button>
      </ButtonIsland>
    );

    const cancel = await component
      .getByRole('button', { name: 'Cancel' })
      .boundingBox();

    expect(cancel).not.toBeNull();
    expect(cancel!.width).toBeLessThan(200);
  });
});
