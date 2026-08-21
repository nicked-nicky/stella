import React from 'react';
import { CloseIcon } from '../../utils/icons';
import styles from './Notification.module.css';

// ============================================================================
// TYPES
// ============================================================================

type NotificationVariant = 'info' | 'success' | 'warning' | 'error' | 'debug';

interface NotificationProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'children'
> {
  /**
   * @default 'info'
   */
  variant?: NotificationVariant;

  /**
   * Optional icon, consumer-supplied (e.g. a Lucide icon wrapped in
   * Terra's `Icon` atom) — Notification doesn't bundle icon glyphs
   * itself, matching Terra's icon-agnostic stance everywhere else.
   */
  icon?: React.ReactNode;

  /** Shows a close button when provided. */
  onDismiss?: () => void;

  /**
   * Set while the toast is playing its exit animation, right before
   * unmount — `NotificationProvider` manages this timing for you (see
   * its `dismiss`). Standalone consumers composing `Notification`
   * directly can drive it themselves the same way: flip it on, wait
   * out the exit animation's duration, then unmount.
   * @default false
   */
  closing?: boolean;

  /** Message content. */
  children: React.ReactNode;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Notification - a single toast card. Typically not used directly —
 * `NotificationProvider` renders these for you via `useNotifications()`.
 * Exported standalone in case you want to compose it into something
 * else (an inline banner, for instance) without going through the
 * queue/portal machinery.
 */
export function Notification({
  variant = 'info',
  icon,
  onDismiss,
  closing = false,
  className,
  children,
  ...props
}: NotificationProps) {
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={[
        styles.notification,
        styles[variant],
        closing && styles.closing,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {icon && (
        <span className={styles.icon} aria-hidden="true">
          {icon}
        </span>
      )}
      <span className={styles.message}>{children}</span>
      {onDismiss && (
        <button
          type="button"
          className={styles.dismiss}
          onClick={onDismiss}
          aria-label="Dismiss notification"
        >
          <CloseIcon />
        </button>
      )}
    </div>
  );
}

Notification.displayName = 'Notification';

export type { NotificationProps, NotificationVariant };
