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
 * Divider - visual separator between content groups.
 *
 * Uses `role="separator"` with `aria-orientation` rather than a native
 * `<hr>`, since `<hr>` has no accessible vertical form — this keeps both
 * orientations semantically correct for assistive tech.
 *
 * Note: `Divider` (vertical) and the `Separator` atom are CSS-identical
 * after the border-width unification — same stretch, width, height and
 * colour. That's intentional, not a missed collapse: `Separator` is the
 * button-group/toolbar-specialized name (exposed as `ButtonIsland.Separator`)
 * and `Divider` is the general content rule (`Menu.Separator` *is* this
 * atom). They're kept as two atoms for the distinct call-site vocabulary,
 * with the two staying visually in sync because they share the same
 * token-driven rules. Prefer `Separator` inside button groups and
 * `Divider` everywhere else.
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
