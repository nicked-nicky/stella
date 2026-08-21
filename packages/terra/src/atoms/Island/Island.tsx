import React, { forwardRef } from 'react';
import styles from './Island.module.css';

// ============================================================================
// TYPES
// ============================================================================

type IslandShape = 'panel' | 'pill';
type IslandTone = 'card' | 'sidebar' | 'header' | 'muted' | 'overlay';
type IslandElement = 'div' | 'section' | 'nav' | 'aside' | 'header' | 'footer';

interface IslandProps extends React.HTMLAttributes<HTMLElement> {
  /**
   * Both shapes use the same rounding (`--stella-radius-panel`) — this
   * only picks the layout: `panel` is block-level, for
   * sidebars/modals/cards/viewports. `pill` sizes to its content, for
   * toolbar/button-group clusters.
   * @default 'panel'
   */
  shape?: IslandShape;

  /**
   * Which surface alias to read the background from — roughly an
   * elevation tier:
   *
   * - `card` — inline content sitting on the window canvas.
   * - `sidebar` — persistent navigation/rail regions.
   * - `header` — toolbars and title-bar clusters.
   * - `muted` — recessed wells (an inset region *below* the canvas).
   * - `overlay` — content that floats above everything else (popovers,
   *   menus, floating panels). Also adds elevation: a drop shadow plus
   *   `--stella-rim`, the hairline top highlight that makes a floating
   *   surface read as catching light from above.
   *
   * @default 'card'
   */
  tone?: IslandTone;

  /**
   * Clip children to the container's radius — matches Ray's
   * `.menu-button-group` (overflow: hidden so square button edges never
   * poke past the pill). Turn off if a child needs to render outside
   * the bounds (a tooltip, a dropdown).
   * @default true
   */
  clip?: boolean;

  /**
   * Rendered element.
   * @default 'div'
   */
  as?: IslandElement;

  children?: React.ReactNode;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Island - the core structural container of Stella-Componente's visual identity.
 *
 * Nothing in a Stella-Componente app should sit flush against the window edge or
 * directly against a sibling region — every top-level area is its own
 * bordered, elevated box with a gap around it, exactly like Ray IDE's
 * `.full-size-container`/`.menu-button-group` and color-cart's `Island`
 * atom. This is the primitive both of those patterns collapse into:
 * `shape="panel"` for the big containers, `shape="pill"` for toolbar
 * clusters (compose with `ButtonIsland` or `Divider` for the latter).
 *
 * Purely structural — no built-in flex/layout behavior. Compose with
 * `FlexContainer` (or pass your own `style`) for how children are
 * arranged inside.
 *
 * @example
 * ```tsx
 * // A floating panel (sidebar, card)
 * <Island shape="panel" style={{ padding: 'var(--stella-space-4)' }}>
 *   <Text variant="title-3">Explorer</Text>
 * </Island>
 *
 * // A toolbar pill grouping buttons with a separator between clusters
 * <Island shape="pill" as="nav">
 *   <FlexContainer gap="1">
 *     <Button iconOnly>...</Button>
 *     <Button iconOnly>...</Button>
 *   </FlexContainer>
 *   <Divider orientation="vertical" />
 *   <FlexContainer gap="1">
 *     <Button iconOnly>...</Button>
 *   </FlexContainer>
 * </Island>
 * ```
 */
export const Island = forwardRef<HTMLElement, IslandProps>(
  (
    {
      shape = 'panel',
      tone = 'card',
      clip = true,
      as = 'div',
      className,
      children,
      ...props
    },
    ref
  ) => {
    const Element = as as React.ElementType;

    return (
      <Element
        ref={ref}
        className={[
          styles.island,
          styles[`shape-${shape}`],
          styles[`tone-${tone}`],
          clip && styles.clip,
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      >
        {children}
      </Element>
    );
  }
);

Island.displayName = 'Island';

export type { IslandProps, IslandShape, IslandTone, IslandElement };
