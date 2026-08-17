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

/** Raw palette hue backing each status color, for the `filled` variant's
 * solid step (see resolveColorVars below). */
const STATUS_HUE: Record<Exclude<BadgeColor, 'neutral'>, string> = {
  success: 'green',
  info: 'blue',
  warning: 'yellow',
  error: 'red',
  debug: 'slate',
};

// ============================================================================
// COLOR RESOLUTION
// ============================================================================

/**
 * Maps color + variant to CSS custom properties. Badge.module.css only
 * ever reads --badge-bg / --badge-text / --badge-border — adding a new
 * color here requires zero new CSS.
 *
 * `neutral` + `tinted`/`outline` is the one combination this function
 * deliberately leaves unset (returns `{}`) — it needs genuinely
 * different raw-palette steps between light and dark (same reason
 * Button.module.css picks its fill steps with `light-dark()`), which a
 * single inline var() reference can't express.
 * Badge.module.css's `[data-color='neutral'][data-variant]` attribute
 * rules own that case instead, resolving per scheme with `light-dark()`
 * — CSS drives it, not a re-render.
 */
function resolveColorVars(
  color: BadgeColor,
  variant: BadgeVariant
): React.CSSProperties {
  // Status colors already have bg/text/border alias triplets defined —
  // reuse them directly for `tinted` and derive filled/outline from them.
  // These are already theme-correct (the alias tokens themselves flip
  // with light/dark), so no gap here.
  if (color !== 'neutral') {
    const bg = `var(--stella-${color}-bg)`;
    const text = `var(--stella-${color}-text)`;
    const border = `var(--stella-${color}-border)`;

    if (variant === 'tinted') {
      return { '--badge-bg': bg, '--badge-text': text, '--badge-border': 'transparent' } as React.CSSProperties;
    }
    if (variant === 'outline') {
      return { '--badge-bg': 'transparent', '--badge-text': text, '--badge-border': border } as React.CSSProperties;
    }
    // filled: use the -700 step of the underlying hue for solid contrast
    const hue = STATUS_HUE[color];
    return {
      '--badge-bg': `var(--stella-${hue}-700)`,
      '--badge-text': 'var(--stella-text-on-fill)',
      '--badge-border': 'transparent',
    } as React.CSSProperties;
  }

  // neutral, filled: a single mid-tone step reads fine against white
  // text in either theme — no branching needed.
  if (variant === 'filled') {
    return {
      '--badge-bg': 'var(--stella-neutral-500)',
      '--badge-text': 'var(--stella-text-on-fill)',
      '--badge-border': 'transparent',
    } as React.CSSProperties;
  }

  // neutral, tinted / outline: handled by Badge.module.css's
  // [data-color='neutral'][data-variant] rules — see the docblock above.
  return {};
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Badge - compact status/label indicator. Non-interactive.
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
  style,
  children,
  ...props
}: BadgeProps) {
  const colorVars = resolveColorVars(color, variant);

  return (
    <span
      className={[styles.badge, className].filter(Boolean).join(' ')}
      data-color={color}
      data-variant={variant}
      style={{ ...colorVars, ...style }}
      {...props}
    >
      {children}
    </span>
  );
}

Badge.displayName = 'Badge';

export type { BadgeProps, BadgeVariant, BadgeColor };
