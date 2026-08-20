import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { Notification } from '../../molecules/Notification';
import type { NotificationVariant } from '../../molecules/Notification';
import { getExitDelay } from '../../utils/motion';

/** Matches --stella-motion-fast — see Notification.module.css's exit keyframes. */
const EXIT_DURATION_MS = 150;

// ============================================================================
// TYPES
// ============================================================================

interface NotifyOptions {
  /** Auto-dismiss delay in ms. `0` disables auto-dismiss entirely. */
  duration?: number;
  icon?: React.ReactNode;
}

interface NotificationItem {
  id: string;
  variant: NotificationVariant;
  message: string;
  duration: number;
  icon?: React.ReactNode;
  /** True once `dismiss` has been called — playing its exit animation,
   * about to be removed from `items` (see `dismiss` below). */
  closing?: boolean;
}

interface NotifyAPI {
  success: (message: string, options?: NotifyOptions) => string;
  warning: (message: string, options?: NotifyOptions) => string;
  error: (message: string, options?: NotifyOptions) => string;
  info: (message: string, options?: NotifyOptions) => string;
  debug: (message: string, options?: NotifyOptions) => string;
  /** Dismiss a notification before its timer would have. */
  dismiss: (id: string) => void;
}

// ============================================================================
// CONTEXT
// ============================================================================

const NotificationContext = createContext<NotifyAPI | undefined>(undefined);

const DEFAULT_DURATION = 5000;
let notificationCounter = 0;

// ============================================================================
// PROVIDER
// ============================================================================

/**
 * NotificationProvider - app-wide toast/notification system.
 *
 * Renders into its own portal (separate from OverlayProvider's — toasts
 * should stay visible even above an open Dialog, so they get their own
 * always-on-top layer rather than competing for stacking order with
 * other overlay types). Handles queueing, auto-dismiss with
 * pause-on-hover, screen-reader announcement via `aria-live`, and a
 * fade-out on dismiss — `dismiss` (manual click or auto-timeout alike)
 * marks the item `closing` and lets its exit animation play before
 * actually removing it from `items`, rather than yanking it out
 * instantly.
 *
 * @example
 * ```tsx
 * <NotificationProvider>
 *   <App />
 * </NotificationProvider>
 *
 * // anywhere inside:
 * const notify = useNotifications();
 * notify.success('Changes saved');
 * notify.error('Something went wrong', { duration: 0 }); // sticky until dismissed
 * ```
 */
export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [root, setRoot] = useState<HTMLElement | null>(null);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  // Separate from `timers` (auto-dismiss countdowns): these fire the
  // *actual* removal from `items`, once each toast's exit animation has
  // had time to play.
  const removeTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map()
  );

  useEffect(() => {
    const el = document.createElement('div');
    el.setAttribute('data-stella-notification-root', '');
    document.body.appendChild(el);
    setRoot(el);
    return () => {
      document.body.removeChild(el);
    };
  }, []);

  // Clear any outstanding timers on unmount.
  useEffect(() => {
    const timerMap = timers.current;
    const removeTimerMap = removeTimers.current;
    return () => {
      timerMap.forEach((timer) => clearTimeout(timer));
      timerMap.clear();
      removeTimerMap.forEach((timer) => clearTimeout(timer));
      removeTimerMap.clear();
    };
  }, []);

  /**
   * Starts a toast's exit: cancels its auto-dismiss countdown (if any),
   * marks it `closing` so Notification plays the fade-out, then removes
   * it from `items` once that animation has had time to finish. Safe to
   * call more than once for the same id (e.g. the dismiss button firing
   * while the auto-dismiss timer is also mid-flight) — the second call
   * just re-marks an already-closing item and reschedules the same
   * removal, no visible difference.
   */
  const dismiss = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }

    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, closing: true } : item))
    );

    const existingRemoveTimer = removeTimers.current.get(id);
    if (existingRemoveTimer) clearTimeout(existingRemoveTimer);
    const removeTimer = setTimeout(() => {
      setItems((prev) => prev.filter((item) => item.id !== id));
      removeTimers.current.delete(id);
    }, getExitDelay(EXIT_DURATION_MS));
    removeTimers.current.set(id, removeTimer);
  }, []);

  const scheduleDismiss = useCallback(
    (id: string, duration: number) => {
      if (duration <= 0) return;
      const timer = setTimeout(() => dismiss(id), duration);
      timers.current.set(id, timer);
    },
    [dismiss]
  );

  const pause = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const resume = useCallback(
    (id: string, duration: number) => {
      scheduleDismiss(id, duration);
    },
    [scheduleDismiss]
  );

  const push = useCallback(
    (variant: NotificationVariant, message: string, options?: NotifyOptions) => {
      const id = `stella-notification-${++notificationCounter}`;
      const duration = options?.duration ?? DEFAULT_DURATION;
      setItems((prev) => [...prev, { id, variant, message, duration, icon: options?.icon }]);
      scheduleDismiss(id, duration);
      return id;
    },
    [scheduleDismiss]
  );

  const notify = useMemo<NotifyAPI>(
    () => ({
      success: (message, options) => push('success', message, options),
      warning: (message, options) => push('warning', message, options),
      error: (message, options) => push('error', message, options),
      info: (message, options) => push('info', message, options),
      debug: (message, options) => push('debug', message, options),
      dismiss,
    }),
    [push, dismiss]
  );

  return (
    <NotificationContext.Provider value={notify}>
      {children}
      {root &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              bottom: 'var(--stella-space-4)',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 10000,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'var(--stella-space-2)',
              pointerEvents: 'none',
            }}
            // Single persistent live region — items are added/removed as
            // children, which screen readers announce automatically.
            // Not sub-typing "assertive" per-variant yet — every variant
            // (including error) reads out at "polite" priority, so a
            // screen reader finishes its current sentence first rather
            // than being interrupted. Worth revisiting if an error toast
            // ever needs to cut in immediately.
            aria-live="polite"
            aria-atomic="false"
          >
            {items.map((item) => (
              <div key={item.id} style={{ pointerEvents: 'auto' }}>
                <Notification
                  variant={item.variant}
                  icon={item.icon}
                  closing={item.closing ?? false}
                  onDismiss={() => dismiss(item.id)}
                  onMouseEnter={() => !item.closing && pause(item.id)}
                  onMouseLeave={() =>
                    !item.closing && resume(item.id, item.duration)
                  }
                >
                  {item.message}
                </Notification>
              </div>
            ))}
          </div>,
          root
        )}
    </NotificationContext.Provider>
  );
}

/**
 * useNotifications - imperative access to the toast queue.
 * Must be called within a `NotificationProvider`.
 */
export function useNotifications(): NotifyAPI {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error(
      'useNotifications must be used within a <NotificationProvider>.'
    );
  }
  return ctx;
}
