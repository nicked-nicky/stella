import React from 'react';
import styles from './Spinner.module.css';

// ============================================================================
// TYPES
// ============================================================================

type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg';

interface SpinnerProps extends React.HTMLAttributes<HTMLSpanElement> {
  /**
   * @default 'md'
   */
  size?: SpinnerSize;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Spinner - indeterminate loading indicator. Inherits `currentColor`,
 * so it matches whatever text color surrounds it (used internally by
 * Button's `loading` state, also usable standalone).
 *
 * @example
 * ```tsx
 * <Spinner />
 * <Spinner size="sm" />
 * <span style={{ color: 'var(--stella-info-text)' }}>
 *   <Spinner />
 * </span>
 * ```
 */
export function Spinner({ size = 'md', className, ...props }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={[styles.spinner, styles[`size-${size}`], className]
        .filter(Boolean)
        .join(' ')}
      {...props}
    />
  );
}

Spinner.displayName = 'Spinner';

export type { SpinnerProps, SpinnerSize };
