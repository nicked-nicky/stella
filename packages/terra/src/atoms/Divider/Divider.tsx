import React from 'react';
import styles from './Divider.module.css';

// ============================================================================
// TYPES
// ============================================================================

type DividerOrientation = 'horizontal' | 'vertical';

interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * @default 'horizontal'
   */
  orientation?: DividerOrientation;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Divider - visual separator between content groups. The one hairline
 * primitive in Terra — `Menu.Separator` and `ButtonIsland.Separator` are
 * both this exact component, pinned to `horizontal`/`vertical`
 * respectively as discoverable statics on their own components, not
 * separate atoms. (There used to be a dedicated `Separator` atom for
 * the button-group case; it was CSS-identical to `Divider` at
 * `orientation="vertical"` after the border-width unification, so it
 * was collapsed into this one component instead of two staying in sync
 * by convention.)
 *
 * Uses `role="separator"` with `aria-orientation` rather than a native
 * `<hr>`, since `<hr>` has no accessible vertical form — this keeps both
 * orientations semantically correct for assistive tech.
 *
 * @example
 * ```tsx
 * <Divider />
 * <Divider orientation="vertical" />
 * ```
 */
export function Divider({
  orientation = 'horizontal',
  className,
  ...props
}: DividerProps) {
  return (
    <div
      role="separator"
      aria-orientation={orientation}
      className={[styles.divider, styles[orientation], className]
        .filter(Boolean)
        .join(' ')}
      {...props}
    />
  );
}

Divider.displayName = 'Divider';

export type { DividerProps, DividerOrientation };
