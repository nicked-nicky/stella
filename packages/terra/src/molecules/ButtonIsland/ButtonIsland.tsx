import React, { Children, cloneElement, forwardRef, isValidElement } from 'react';
import { Island } from '../../atoms/Island';
import type { IslandProps } from '../../atoms/Island';
import { FlexContainer } from '../../layout/FlexContainer';
import type { FlexContainerProps } from '../../layout/FlexContainer';
import { Button } from '../../atoms/Button';
import type { ButtonSize } from '../../atoms/Button';
import { Divider } from '../../atoms/Divider';
import type { DividerProps } from '../../atoms/Divider';
import styles from './ButtonIsland.module.css';

// ============================================================================
// TYPES
// ============================================================================

interface ButtonIslandProps
  extends Omit<FlexContainerProps, 'direction' | 'ref'>,
    Pick<IslandProps, 'tone' | 'clip'> {
  /**
   * Sizing token applied to every `Button` child. A Button that already
   * has its own explicit `size` prop keeps it — this only sets the
   * default, it doesn't force an override.
   * @default 'md'
   */
  size?: ButtonSize;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * ButtonIsland - a row of related actions rendered as one pill-shaped
 * toolbar cluster. The only correct way to use `Button`: it carries no
 * radius or surface of its own, so it's always meant to live inside an
 * Island — even standalone. Composes `Island` (shape="pill") for chrome
 * and `FlexContainer` for layout, with a `size` cascade so you set it
 * once instead of on every `Button`.
 *
 * Buttons sit flush, zero gap; the hairline between adjacent ones is a
 * real `Divider`, auto-inserted for you (an explicit
 * `ButtonIsland.Separator` you place yourself is left alone, for a
 * deliberate sub-cluster break instead of the automatic per-pair one).
 * Only `Button` children get the size cascade. Children stretch to the
 * island's full interior height; a lone `Button` child also grows along
 * the main axis. See WIKI.md's Architecture reference for the full
 * border/separator reasoning.
 *
 * @example
 * ```tsx
 * // The hairline between Cancel and Save is automatic — no Separator needed
 * <ButtonIsland size="sm">
 *   <Button>Cancel</Button>
 *   <Button>Save</Button>
 * </ButtonIsland>
 *
 * // ButtonIsland.Separator for a deliberate sub-cluster break
 * <ButtonIsland size="sm">
 *   <Button iconOnly aria-label="Bold">B</Button>
 *   <Button iconOnly aria-label="Italic">I</Button>
 *   <ButtonIsland.Separator />
 *   <Button iconOnly aria-label="Settings">⚙</Button>
 * </ButtonIsland>
 *
 * // Single button — fills whatever width/height the Island is given
 * <ButtonIsland style={{ alignSelf: 'stretch' }}>
 *   <Button>New note</Button>
 * </ButtonIsland>
 * ```
 */
const ButtonIslandBase = forwardRef<HTMLElement, ButtonIslandProps>(
  (
    {
      size = 'md',
      gap = '0',
      align,
      tone = 'header',
      clip = true,
      children,
      style,
      className,
      ...flexProps
    },
    ref
  ) => {
    const childArray = Children.toArray(children);
    const onlyChild = childArray.length === 1 ? childArray[0] : undefined;
    const isSingleButton = isValidElement(onlyChild) && onlyChild.type === Button;

    // Built up by hand rather than `Children.map` — inserting the
    // auto-hairline `Divider` between Button pairs means the output
    // array is longer than the input, which `Children.map` (a 1:1
    // transform) can't express.
    const sizedChildren: React.ReactNode[] = [];
    childArray.forEach((child, index) => {
      if (isValidElement(child) && child.type === Button) {
        const childProps = child.props as { size?: ButtonSize; className?: string };
        // Built up rather than spread as one literal: `className` is only
        // ever set (never set-to-undefined) — exactOptionalPropertyTypes
        // rejects an explicit `undefined` for an optional-but-not-nullable
        // prop, and omitting the key entirely is also just correct here —
        // multi-button children shouldn't have their className touched.
        const overrides: { size: ButtonSize; className?: string } = {
          size: childProps.size ?? size,
        };
        if (isSingleButton) {
          overrides.className = [styles.stretchButton, childProps.className]
            .filter(Boolean)
            .join(' ');
        }
        sizedChildren.push(
          cloneElement(
            child as React.ReactElement<{ size?: ButtonSize; className?: string }>,
            overrides
          )
        );

        // Auto-hairline: a real Divider between this Button and the
        // next, only when the next sibling is also a bare Button — an
        // explicit ButtonIsland.Separator the caller already placed
        // here shouldn't get a second one stacked next to it.
        const next = childArray[index + 1];
        if (isValidElement(next) && next.type === Button) {
          sizedChildren.push(
            <Divider key={`${child.key ?? index}-hairline`} orientation="vertical" />
          );
        }
      } else {
        sizedChildren.push(child);
      }
    });

    return (
      <Island
        ref={ref}
        shape="pill"
        tone={tone}
        clip={clip}
        // Internal hook only, not the consumer's `className` (that goes
        // on the inner FlexContainer/`.group` — see above): lets
        // ButtonIsland.module.css react this specific Island's border to
        // a hovered/pressed Button child via `:has()`, scoped to
        // ButtonIsland instead of leaking onto every Island in the kit.
        className={styles.root}
        // `alignItems: stretch` overrides Island's own `center` so the
        // inner button row fills the island's interior height instead of
        // being centered at its content height. Without it the buttons'
        // own `align-items: stretch` has nothing taller to stretch into,
        // and an island given an explicit height (WindowChrome pinning
        // its regions to --stella-bar-height) leaves dead space above
        // and below its buttons. Spread last so a caller's own `style`
        // still wins.
        style={{ alignItems: 'stretch', ...style }}
      >
        <FlexContainer
          direction="row"
          gap={gap}
          align={align ?? 'stretch'}
          className={[styles.group, className].filter(Boolean).join(' ')}
          {...flexProps}
        >
          {sizedChildren}
        </FlexContainer>
      </Island>
    );
  }
);

ButtonIslandBase.displayName = 'ButtonIsland';

// ============================================================================
// SEPARATOR — sugar for splitting a ButtonIsland into sub-clusters.
// ============================================================================

/**
 * ButtonIsland.Separator - a `Divider` pinned to `orientation="vertical"`,
 * discoverable as a static on `ButtonIsland` for Ray IDE's
 * `.menu-button-group`-style toolbar breaks. Not a separate atom — same
 * move `Menu.Separator` makes with `Divider` pinned to `horizontal`
 * instead, so both statics stay visually in sync automatically rather
 * than by two implementations happening to agree.
 */
function ButtonIslandSeparator(props: Omit<DividerProps, 'orientation'>) {
  return <Divider orientation="vertical" {...props} />;
}

type ButtonIslandComponent = typeof ButtonIslandBase & {
  Separator: typeof ButtonIslandSeparator;
};

const ButtonIsland = ButtonIslandBase as ButtonIslandComponent;
ButtonIsland.Separator = ButtonIslandSeparator;

export { ButtonIsland };
export type { ButtonIslandProps };
