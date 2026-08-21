import { describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OverlayProvider, useOverlayContext } from './OverlayProvider';
import { useOverlayLayer } from './useOverlayLayer';

// OverlayProvider is the highest-leverage thing in the kit to get right:
// Dialog, Menu and Popover all route their Escape handling and stacking
// through it, so a regression here breaks three components at once and
// does it silently — the overlay still opens, it just stops closing, or
// closes too much. The nested-Escape case in particular ("a Popover
// opened inside a Dialog must not close the Dialog underneath") is the
// exact behaviour the provider exists to provide.

/** Minimal overlay consumer — reports its own topmost status to the DOM. */
function TestLayer({
  label,
  open,
  onClose,
  closeOnEscape,
}: {
  label: string;
  open: boolean;
  onClose?: () => void;
  closeOnEscape?: boolean;
}) {
  const { root, topmost } = useOverlayLayer({
    open,
    ...(onClose ? { onClose } : {}),
    ...(closeOnEscape === undefined ? {} : { closeOnEscape }),
  });
  if (!open || !root) return null;
  return <div data-testid={label} data-topmost={topmost} />;
}

describe('OverlayProvider — portal root', () => {
  it('creates a single shared portal root on the body', async () => {
    render(
      <OverlayProvider>
        <div />
      </OverlayProvider>
    );
    await waitFor(() => {
      expect(
        document.querySelectorAll('[data-stella-overlay-root]')
      ).toHaveLength(1);
    });
  });

  it('removes the portal root on unmount, leaving no orphan node behind', async () => {
    const { unmount } = render(
      <OverlayProvider>
        <div />
      </OverlayProvider>
    );
    await waitFor(() =>
      expect(
        document.querySelector('[data-stella-overlay-root]')
      ).not.toBeNull()
    );
    unmount();
    expect(document.querySelector('[data-stella-overlay-root]')).toBeNull();
  });
});

describe('OverlayProvider — stacking', () => {
  it('the most recently opened layer is the topmost one', async () => {
    render(
      <OverlayProvider>
        <TestLayer label="first" open />
        <TestLayer label="second" open />
      </OverlayProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('second')).toHaveAttribute(
        'data-topmost',
        'true'
      );
    });
    expect(screen.getByTestId('first')).toHaveAttribute(
      'data-topmost',
      'false'
    );
  });

  it('closing the top layer hands topmost back to the one underneath', async () => {
    function Harness() {
      const [secondOpen, setSecondOpen] = useState(true);
      return (
        <OverlayProvider>
          <TestLayer label="first" open />
          <TestLayer label="second" open={secondOpen} />
          <button onClick={() => setSecondOpen(false)}>close second</button>
        </OverlayProvider>
      );
    }
    const user = userEvent.setup();
    render(<Harness />);

    await waitFor(() =>
      expect(screen.getByTestId('first')).toHaveAttribute(
        'data-topmost',
        'false'
      )
    );

    await user.click(screen.getByRole('button', { name: 'close second' }));

    await waitFor(() =>
      expect(screen.getByTestId('first')).toHaveAttribute(
        'data-topmost',
        'true'
      )
    );
  });

  it('a layer that was never opened is not topmost', async () => {
    render(
      <OverlayProvider>
        <TestLayer label="only" open={false} />
      </OverlayProvider>
    );
    expect(screen.queryByTestId('only')).toBeNull();
  });
});

describe('OverlayProvider — Escape scoping', () => {
  it('Escape closes the topmost layer', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <OverlayProvider>
        <TestLayer label="only" open onClose={onClose} />
      </OverlayProvider>
    );

    await waitFor(() =>
      expect(screen.getByTestId('only')).toHaveAttribute('data-topmost', 'true')
    );
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('Escape closes ONLY the topmost layer, not the ones beneath it', async () => {
    // The reason this provider exists: a Popover opened from inside a
    // Dialog must not take the Dialog down with it.
    const user = userEvent.setup();
    const closeOuter = vi.fn();
    const closeInner = vi.fn();

    render(
      <OverlayProvider>
        <TestLayer label="outer" open onClose={closeOuter} />
        <TestLayer label="inner" open onClose={closeInner} />
      </OverlayProvider>
    );

    await waitFor(() =>
      expect(screen.getByTestId('inner')).toHaveAttribute(
        'data-topmost',
        'true'
      )
    );

    await user.keyboard('{Escape}');

    expect(closeInner).toHaveBeenCalledTimes(1);
    expect(closeOuter).not.toHaveBeenCalled();
  });

  it('after the top layer closes, Escape reaches the layer beneath', async () => {
    function Harness() {
      const [innerOpen, setInnerOpen] = useState(true);
      return (
        <OverlayProvider>
          <TestLayer label="outer" open onClose={closeOuter} />
          <TestLayer
            label="inner"
            open={innerOpen}
            onClose={() => setInnerOpen(false)}
          />
        </OverlayProvider>
      );
    }
    const user = userEvent.setup();
    const closeOuter = vi.fn();
    render(<Harness />);

    await waitFor(() =>
      expect(screen.getByTestId('inner')).toHaveAttribute(
        'data-topmost',
        'true'
      )
    );

    await user.keyboard('{Escape}'); // closes inner
    await waitFor(() => expect(screen.queryByTestId('inner')).toBeNull());
    expect(closeOuter).not.toHaveBeenCalled();

    await user.keyboard('{Escape}'); // now reaches outer
    expect(closeOuter).toHaveBeenCalledTimes(1);
  });

  it('closeOnEscape={false} opts a layer out without blocking the rest', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <OverlayProvider>
        <TestLayer label="only" open onClose={onClose} closeOnEscape={false} />
      </OverlayProvider>
    );
    await waitFor(() => expect(screen.getByTestId('only')).toBeInTheDocument());
    await user.keyboard('{Escape}');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('ignores keys other than Escape', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <OverlayProvider>
        <TestLayer label="only" open onClose={onClose} />
      </OverlayProvider>
    );
    await waitFor(() =>
      expect(screen.getByTestId('only')).toHaveAttribute('data-topmost', 'true')
    );
    await user.keyboard('{Enter}');
    await user.keyboard('a');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('stops listening once the layer unmounts', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { unmount } = render(
      <OverlayProvider>
        <TestLayer label="only" open onClose={onClose} />
      </OverlayProvider>
    );
    await waitFor(() =>
      expect(screen.getByTestId('only')).toHaveAttribute('data-topmost', 'true')
    );
    unmount();
    await user.keyboard('{Escape}');
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe('useOverlayContext — guard', () => {
  it('throws a named, actionable error when used outside a provider', () => {
    function Orphan() {
      useOverlayContext();
      return null;
    }
    // React logs the error boundary trace; silence it for this one case.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Orphan />)).toThrow(
      /must be used within an <OverlayProvider>/
    );
    spy.mockRestore();
  });
});
