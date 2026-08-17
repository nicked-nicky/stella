import React, { cloneElement, isValidElement } from 'react';
import styles from './Icon.module.css';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Matches the icon grid defined in Icon.module.css — 16/20/24px,
 * symbolic (monochrome, `currentColor`) by convention for Terra.
 */
type IconSize = 'sm' | 'md' | 'lg';

interface IconProps extends React.HTMLAttributes<HTMLSpanElement> {
  /**
   * @default 'md'  (20px)
   */
  size?: IconSize;

  /**
   * Accessible name. When provided, the icon is exposed to assistive
   * tech as `role="img"` with this label. When omitted, the icon is
   * `aria-hidden` — the correct default for icons that sit next to
   * their own visible text (e.g. inside a Button).
   */
  title?: string;

  /** The SVG (or other icon element) to render at a consistent size. */
  children: React.ReactNode;
}

// ============================================================================
// SIZE TOKEN → PIXELS
// ============================================================================

const SIZE_PX: Record<IconSize, number> = {
  sm: 16,
  md: 20,
  lg: 24,
};

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Icon - sizing/color wrapper around any icon element.
 *
 * Terra ships no icon set of its own and takes no dependency on one —
 * `lucide-react` (or anything else) stays the *consumer's* choice, not
 * something bundled into Terra (a single icon library import can be
 * 30–100KB before tree-shaking, real weight for a "thin" base
 * package). This component's job is to translate one size token into
 * whatever the child icon actually understands:
 *
 * - **lucide-react** icons read a numeric `size` prop directly
 *   (`<Rose size={18} />`) — cloned onto the child here, so the icon's
 *   internal stroke-width scales correctly rather than being stretched
 *   by CSS after the fact.
 * - Hand-rolled `<svg>` icons don't take a `size` prop, so `width` /
 *   `height` are cloned on too, and the wrapping `<span>` + CSS class
 *   is a backstop for anything that ignores all three.
 *
 * One size token in, correct sizing out, regardless of which icon
 * convention the child follows.
 *
 * @example
 * ```tsx
 * import { Rose, X } from 'lucide-react';
 *
 * // lucide-react — size prop is injected automatically
 * <Icon size="sm"><Rose /></Icon>
 *
 * // Standalone, meaningful on its own — needs a label
 * <Icon size="lg" title="Warning"><WarningSvg /></Icon>
 *
 * // Inside an icon-only Button: the *Button* carries aria-label, not
 * // Icon — Button wraps its icon-only content in aria-hidden (correct,
 * // per WAI-ARIA icon-button practice), which would silently swallow
 * // an aria-label set on a nested Icon instead.
 * <Button iconOnly aria-label="Close">
 *   <Icon><X /></Icon>
 * </Button>
 * ```
 */
export function Icon({
  size = 'md',
  title,
  className,
  children,
  ...props
}: IconProps) {
  const px = SIZE_PX[size];

  const content = isValidElement(children)
    ? cloneElement(children as React.ReactElement<Record<string, unknown>>, {
        size: px, // lucide-react and most icon libraries read this
        width: px, // fallback for icons that use width/height instead
        height: px,
      })
    : children;

  return (
    <span
      className={[styles.icon, styles[`size-${size}`], className]
        .filter(Boolean)
        .join(' ')}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      {...props}
    >
      {content}
    </span>
  );
}

Icon.displayName = 'Icon';

export type { IconProps, IconSize };
