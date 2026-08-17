import React from 'react';
import styles from './Separator.module.css';

// ============================================================================
// TYPES
// ============================================================================

interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Separator - a thin vertical rule between button-group/toolbar
 * sub-clusters, matching Ray IDE's dedicated `Separator` atom for its
 * `.menu-button-group`. Always fills the full height of its flex
 * container (`align-self: stretch`, not a fixed height — works at any
 * `Button` size) and its thickness follows `--stella-border-width`, the
 * same token every other hairline in Terra reads (see
 * `ThemeManager.setBorderWidth`).
 *
 * `ButtonIsland.Separator` is this exact component — reach for it there
 * when you're already inside a `ButtonIsland`. Use `Separator` directly
 * for a vertical rule outside that context. For a horizontal rule
 * between content sections, use `Divider` instead — that's a distinct,
 * general-purpose primitive, not this one.
 *
 * @example
 * ```tsx
 * <ButtonIsland size="sm">
 *   <Button iconOnly aria-label="Bold">B</Button>
 *   <Button iconOnly aria-label="Italic">I</Button>
 *   <Separator />
 *   <Button iconOnly aria-label="Settings">⚙</Button>
 * </ButtonIsland>
 * ```
 */
export function Separator({ className, ...props }: SeparatorProps) {
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      className={[styles.separator, className].filter(Boolean).join(' ')}
      {...props}
    />
  );
}

Separator.displayName = 'Separator';

export type { SeparatorProps };
