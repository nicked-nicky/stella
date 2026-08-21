import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { NotificationProvider, useNotifications } from './NotificationProvider';

// Almost all of this provider's behaviour is timer-driven, which makes
// it both the easiest thing in the kit to get subtly wrong and the
// easiest to test deterministically with fake timers. The cases that
// matter are the ones a manual click-through would never catch:
// pause-on-hover actually cancelling the countdown, dismissing one toast
// not disturbing its neighbours' timers, and duration: 0 meaning
// "sticky" rather than "dismiss immediately".

const DEFAULT_DURATION = 5000;
/** Matches EXIT_DURATION_MS in NotificationProvider. */
const EXIT_DURATION = 150;

/** Exposes the imperative API to the test body. Assigned during the
 * provider's first render, before any test body touches it. */
let notify!: ReturnType<typeof useNotifications>;

function Consumer() {
  notify = useNotifications();
  return null;
}

function renderProvider() {
  return render(
    <NotificationProvider>
      <Consumer />
    </NotificationProvider>
  );
}

/** Advance past a toast's auto-dismiss *and* its exit animation. */
async function advance(ms: number) {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
}

/**
 * Interactions here use `fireEvent`, not `user-event`, and that's a
 * deliberate exception to the pattern the rest of the suite follows.
 *
 * user-event is the better default — it models a real user, firing the
 * full event sequence a browser would. But it is asynchronous by design,
 * and under fake timers its internal waits and vitest's frozen clock
 * deadlock each other: the interaction waits for time that nothing is
 * advancing. `advanceTimers` plus `delay: null` is the documented
 * escape hatch and still wasn't enough here.
 *
 * Every test in this file is *about* timer behaviour, so fake timers are
 * non-negotiable and the interaction is the part that gives. fireEvent
 * is synchronous and has no timer interaction at all.
 *
 * mouseOver/mouseOut rather than mouseEnter/mouseLeave because React
 * synthesises onMouseEnter/onMouseLeave from the delegated over/out
 * events — dispatching a native `mouseenter` reaches no React handler.
 */
function hover(element: HTMLElement) {
  fireEvent.mouseOver(element);
}

function unhover(element: HTMLElement) {
  fireEvent.mouseOut(element);
}

describe('NotificationProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('queueing', () => {
    it('renders a pushed notification', async () => {
      renderProvider();
      await act(async () => {
        notify.success('Changes saved');
      });
      expect(screen.getByText('Changes saved')).toBeInTheDocument();
    });

    it('stacks multiple notifications in push order', async () => {
      renderProvider();
      await act(async () => {
        notify.info('First');
        notify.info('Second');
        notify.info('Third');
      });

      const messages = screen
        .getAllByRole('status')
        .map((el) => el.textContent);
      expect(messages[0]).toContain('First');
      expect(messages[1]).toContain('Second');
      expect(messages[2]).toContain('Third');
    });

    it('returns an id that can be used to dismiss a specific toast', async () => {
      renderProvider();
      let id = '';
      await act(async () => {
        id = notify.info('Dismiss me');
        notify.info('Keep me');
      });

      await act(async () => {
        notify.dismiss(id);
      });
      await advance(EXIT_DURATION);

      expect(screen.queryByText('Dismiss me')).toBeNull();
      expect(screen.getByText('Keep me')).toBeInTheDocument();
    });

    it('gives error toasts role="alert" and everything else role="status"', async () => {
      renderProvider();
      await act(async () => {
        notify.error('Broke');
        notify.success('Fine');
      });
      expect(screen.getByRole('alert')).toHaveTextContent('Broke');
      expect(screen.getByRole('status')).toHaveTextContent('Fine');
    });
  });

  describe('announcement', () => {
    it('renders a single persistent polite live region', async () => {
      renderProvider();
      const region = document.querySelector('[aria-live]');
      expect(region).not.toBeNull();
      expect(region).toHaveAttribute('aria-live', 'polite');

      // Persistent, not created per-toast — a live region added at the
      // same time as its content is frequently not announced at all.
      await act(async () => {
        notify.info('Hello');
      });
      expect(document.querySelectorAll('[aria-live]')).toHaveLength(1);
    });

    it('adds toast content as children of the existing live region', async () => {
      renderProvider();
      await act(async () => {
        notify.info('Announce me');
      });
      const region = document.querySelector('[aria-live]');
      expect(region).toHaveTextContent('Announce me');
    });
  });

  describe('auto-dismiss', () => {
    it('removes a toast after its duration plus the exit animation', async () => {
      renderProvider();
      await act(async () => {
        notify.info('Temporary');
      });

      await advance(DEFAULT_DURATION - 1);
      expect(screen.getByText('Temporary')).toBeInTheDocument();

      await advance(1 + EXIT_DURATION);
      expect(screen.queryByText('Temporary')).toBeNull();
    });

    it('honours a custom duration', async () => {
      renderProvider();
      await act(async () => {
        notify.info('Quick', { duration: 1000 });
      });

      await advance(1000 + EXIT_DURATION);
      expect(screen.queryByText('Quick')).toBeNull();
    });

    it('duration: 0 makes a toast sticky rather than dismissing it instantly', async () => {
      renderProvider();
      await act(async () => {
        notify.error('Needs acknowledgement', { duration: 0 });
      });

      await advance(DEFAULT_DURATION * 3);
      expect(screen.getByText('Needs acknowledgement')).toBeInTheDocument();
    });

    it('runs each toast’s timer independently', async () => {
      renderProvider();
      await act(async () => {
        notify.info('Short', { duration: 1000 });
        notify.info('Long', { duration: 8000 });
      });

      await advance(1000 + EXIT_DURATION);
      expect(screen.queryByText('Short')).toBeNull();
      expect(screen.getByText('Long')).toBeInTheDocument();
    });
  });

  describe('pause on hover', () => {
    it('suspends the auto-dismiss countdown while hovered', async () => {
      renderProvider();
      await act(async () => {
        notify.info('Hover me', { duration: 1000 });
      });

      hover(screen.getByRole('status'));
      await advance(5000);

      expect(screen.getByText('Hover me')).toBeInTheDocument();
    });

    it('restarts the countdown on unhover', async () => {
      renderProvider();
      await act(async () => {
        notify.info('Hover me', { duration: 1000 });
      });

      const toast = screen.getByRole('status');
      hover(toast);
      await advance(5000);
      unhover(toast);

      await advance(1000 + EXIT_DURATION);
      expect(screen.queryByText('Hover me')).toBeNull();
    });
  });

  describe('manual dismiss', () => {
    it('the dismiss button removes the toast', async () => {
      renderProvider();
      await act(async () => {
        notify.info('Close me');
      });

      fireEvent.click(
        screen.getByRole('button', { name: 'Dismiss notification' })
      );
      await advance(EXIT_DURATION);

      expect(screen.queryByText('Close me')).toBeNull();
    });

    it('plays the exit animation before removing, rather than yanking the node out', async () => {
      renderProvider();
      let id = '';
      await act(async () => {
        id = notify.info('Fading');
      });

      await act(async () => {
        notify.dismiss(id);
      });

      // Still mounted mid-animation.
      expect(screen.getByText('Fading')).toBeInTheDocument();

      await advance(EXIT_DURATION);
      expect(screen.queryByText('Fading')).toBeNull();
    });

    it('dismissing twice is safe and does not throw', async () => {
      renderProvider();
      let id = '';
      await act(async () => {
        id = notify.info('Double');
      });

      await act(async () => {
        notify.dismiss(id);
        notify.dismiss(id);
      });
      await advance(EXIT_DURATION);

      expect(screen.queryByText('Double')).toBeNull();
    });

    it('dismissing one toast leaves its neighbours’ timers intact', async () => {
      renderProvider();
      let first = '';
      await act(async () => {
        first = notify.info('First', { duration: 3000 });
        notify.info('Second', { duration: 3000 });
      });

      await act(async () => {
        notify.dismiss(first);
      });
      await advance(EXIT_DURATION);
      expect(screen.getByText('Second')).toBeInTheDocument();

      await advance(3000 + EXIT_DURATION);
      expect(screen.queryByText('Second')).toBeNull();
    });
  });

  describe('portal lifecycle', () => {
    // No waitFor here on purpose: RTL's render flushes effects inside
    // act, so the portal root exists by the time render returns. waitFor
    // would poll on a clock that fake timers have frozen, and simply
    // hang until the test times out.
    it('mounts its own root, separate from the overlay portal', () => {
      renderProvider();
      expect(
        document.querySelector('[data-stella-notification-root]')
      ).not.toBeNull();
    });

    it('removes its root on unmount', () => {
      const { unmount } = renderProvider();
      expect(
        document.querySelector('[data-stella-notification-root]')
      ).not.toBeNull();
      unmount();
      expect(
        document.querySelector('[data-stella-notification-root]')
      ).toBeNull();
    });
  });

  describe('guard', () => {
    it('throws a named error when useNotifications is called outside the provider', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => render(<Consumer />)).toThrow(
        /must be used within a <NotificationProvider>/
      );
      spy.mockRestore();
    });
  });
});
