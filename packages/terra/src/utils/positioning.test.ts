import { describe, expect, it } from 'vitest';
import { computeAnchoredPosition, pointAnchor } from './positioning';
import type { Placement } from './positioning';

// positioning.ts is pure geometry — no DOM reads, no React — which makes
// it the one part of the overlay stack that can be tested exhaustively
// with zero setup and zero flake. Every anchored component in the kit
// (Tooltip, Popover, Menu, context menus) resolves its position through
// this one function, so a regression here is a regression everywhere at
// once. Testing it directly rather than only through those four
// consumers is the point: a failure here names the broken unit.

const VIEWPORT = { viewportWidth: 1000, viewportHeight: 800 };

/** Anchor sitting comfortably mid-viewport — nothing collides. */
const CENTER_ANCHOR = { top: 400, left: 400, width: 100, height: 40 };

function compute(
  placement: Placement,
  overrides: Partial<Parameters<typeof computeAnchoredPosition>[0]> = {}
) {
  return computeAnchoredPosition({
    anchorRect: CENTER_ANCHOR,
    panelWidth: 200,
    panelHeight: 100,
    placement,
    offset: 8,
    padding: 8,
    ...VIEWPORT,
    ...overrides,
  });
}

describe('computeAnchoredPosition — side placement', () => {
  it('places below the anchor for `bottom`, offset by `offset`', () => {
    const { top, placement } = compute('bottom');
    // anchor bottom edge (400 + 40) + offset (8)
    expect(top).toBe(448);
    expect(placement).toBe('bottom');
  });

  it('places above the anchor for `top`, accounting for panel height', () => {
    const { top } = compute('top');
    // anchor top (400) - panelHeight (100) - offset (8)
    expect(top).toBe(292);
  });

  it('places left of the anchor for `left`', () => {
    const { left } = compute('left');
    // anchor left (400) - panelWidth (200) - offset (8)
    expect(left).toBe(192);
  });

  it('places right of the anchor for `right`', () => {
    const { left } = compute('right');
    // anchor right edge (400 + 100) + offset (8)
    expect(left).toBe(508);
  });
});

describe('computeAnchoredPosition — alignment', () => {
  it('`start` aligns the panel to the anchor’s leading edge', () => {
    expect(compute('bottom-start').left).toBe(400);
  });

  it('`end` aligns the panel’s trailing edge to the anchor’s', () => {
    // anchor right edge (500) - panelWidth (200)
    expect(compute('bottom-end').left).toBe(300);
  });

  it('bare side means centre alignment', () => {
    // anchor centre (450) - half panel (100)
    expect(compute('bottom').left).toBe(350);
  });

  it('centres on the cross-axis for left/right sides too', () => {
    // anchor vertical centre (420) - half panel height (50)
    expect(compute('right').top).toBe(370);
  });
});

describe('computeAnchoredPosition — flip', () => {
  it('flips bottom → top when there is no room below', () => {
    // Anchor near the bottom edge: 700 + 40 + 8 + 100 > 800
    const { placement, top } = compute('bottom', {
      anchorRect: { top: 700, left: 400, width: 100, height: 40 },
    });
    expect(placement).toBe('top');
    expect(top).toBe(592); // 700 - 100 - 8
  });

  it('flips top → bottom when there is no room above', () => {
    const { placement } = compute('top', {
      anchorRect: { top: 20, left: 400, width: 100, height: 40 },
    });
    expect(placement).toBe('bottom');
  });

  it('flips right → left when there is no room to the right', () => {
    const { placement } = compute('right', {
      anchorRect: { top: 400, left: 900, width: 100, height: 40 },
    });
    expect(placement).toBe('left');
  });

  it('preserves alignment across a flip', () => {
    const { placement } = compute('bottom-end', {
      anchorRect: { top: 700, left: 400, width: 100, height: 40 },
    });
    expect(placement).toBe('top-end');
  });

  it('keeps the preferred side when neither side fits, rather than flipping into an equally bad spot', () => {
    // Panel taller than the viewport — nothing fits anywhere.
    const { placement } = compute('bottom', { panelHeight: 900 });
    expect(placement).toBe('bottom');
  });

  it('does not flip when the preferred side fits', () => {
    expect(compute('bottom').placement).toBe('bottom');
  });
});

describe('computeAnchoredPosition — cross-axis shift', () => {
  it('shifts right to stay `padding` clear of the left viewport edge', () => {
    const { left } = compute('bottom-end', {
      anchorRect: { top: 400, left: 0, width: 40, height: 40 },
    });
    // Would be 40 - 200 = -160; clamped to padding.
    expect(left).toBe(8);
  });

  it('shifts left to stay `padding` clear of the right viewport edge', () => {
    const { left } = compute('bottom-start', {
      anchorRect: { top: 400, left: 950, width: 40, height: 40 },
    });
    // Would be 950; clamped to viewportWidth - panelWidth - padding.
    expect(left).toBe(792);
  });

  it('shifts on the vertical axis for left/right placements', () => {
    const { top } = compute('right-start', {
      anchorRect: { top: 780, left: 400, width: 40, height: 40 },
    });
    // Would be 780; clamped to viewportHeight - panelHeight - padding.
    expect(top).toBe(692);
  });

  it('does not shift a panel that already fits', () => {
    expect(compute('bottom-start').left).toBe(400);
  });

  it('shifting never changes the resolved side', () => {
    const { placement } = compute('bottom-start', {
      anchorRect: { top: 400, left: 950, width: 40, height: 40 },
    });
    expect(placement).toBe('bottom-start');
  });
});

describe('pointAnchor', () => {
  it('reports a zero-size rect at the given point, satisfying the VirtualAnchor contract', () => {
    const rect = pointAnchor(120, 340).getBoundingClientRect();
    expect(rect).toEqual({ top: 340, left: 120, width: 0, height: 0 });
  });

  it('positions a context menu from the cursor, not from an element', () => {
    const { top, left } = compute('bottom-start', {
      anchorRect: pointAnchor(120, 340).getBoundingClientRect(),
    });
    expect(top).toBe(348); // 340 + 0 height + 8 offset
    expect(left).toBe(120);
  });
});
