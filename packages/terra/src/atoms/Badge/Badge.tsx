import React from 'react';
import styles from './Badge.module.css';

// ============================================================================
// TYPES
// ============================================================================

type BadgeVariant = 'filled' | 'tinted' | 'outline';
type BadgeColor = 'neutral' | 'success' | 'info' | 'warning' | 'error' | 'debug';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /**
   * Visual style of the badge.
   * @default 'tinted'
   */
  variant?: BadgeVariant;

  /**
   * Semantic color. `success`/`info`/`warning`/`error`/`debug` reuse the
   * alias status tokens — these 5 are the only place color appears in
   * Stella (single neutral color scheme, no accent hue).
   * @default 'neutral'
   */
  color?: BadgeColor;

  children?: React.ReactNode;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Badge - compact status/label indicator. Non-interactive.
 *
 * Purely a `data-color`/`data-variant` attribute carrier — all 15
 * color×variant combinations are resolved by Badge.module.css's
 * `[data-color][data-variant]` rules, reading straight off each status
 * hue's `-text`/`-bg`/`-border` alias triplet in tokens.css. Adding a
 * new color is a CSS-only change (new alias triplet + one rule block),
 * not a JS one — there used to be a `resolveColorVars` function doing
 * this in JS via inline custom properties; it's gone because attribute
 * selectors do the same job with zero re-renders and no JS/CSS boundary
 * to keep in sync.
 *
 * @example
 * ```tsx
 * <Badge>Default</Badge>
 * <Badge color="success" variant="tinted">Active</Badge>
 * <Badge color="error" variant="filled">3 errors</Badge>
 * <Badge color="debug" variant="outline">Verbose</Badge>
 * ```
 */
export function Badge({
  variant = 'tinted',
  color = 'neutral',
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={[styles.badge, className].filter(Boolean).join(' ')}
      data-color={color}
      data-variant={variant}
      {...props}
    >
      {children}
    </span>
  );
}

Badge.displayName = 'Badge';

export type { BadgeProps, BadgeVariant, BadgeColor };
