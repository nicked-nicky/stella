import React, { Children, cloneElement, forwardRef, isValidElement } from 'react';
import { Island } from '../../atoms/Island';
import type { IslandProps } from '../../atoms/Island';
import { FlexContainer } from '../../layout/FlexContainer';
import type { FlexContainerProps } from '../../layout/FlexContainer';
import { Button } from '../../atoms/Button';
import type { ButtonSize } from '../../atoms/Button';
import { Separator } from '../../atoms/Separator';
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
 * toolbar cluster — Stella's version of Ray IDE's `.menu-button-group`
 * and color-cart's `Island` + button combination. This is the only
 * correct way to use `Button`: a Button carries neither a radius nor a
 * surface of its own (see Button.module.css), so every `Button` is
 * meant to live inside an Island — even a single standalone button.
 * The Island's `header` tone is the surface you actually see behind
 * each button, and its radius + clip is what rounds the group's ends.
 *
 * Composes `Island` (shape="pill", sized to its content rather than
 * stretching to fill its container — see Island.module.css) for the
 * visual chrome with `FlexContainer` for layout and a size-token
 * cascade so you set `size` once instead of repeating it on every
 * `Button`.
 *
 * Matches Ray's `.menu-button-group`: zero gap between children —
 * buttons sit flush, touching each other, the group's edges, and any
 * separator in between. An automatic hairline (`.group > button +
 * button`, reserved via `Button`'s own transparent border and colored
 * in only where a Button sibling precedes another) separates adjacent
 * buttons, so no manual separator is needed for the common case. Reach
 * for `ButtonIsland.Separator` when you want a stronger sub-cluster
 * break (it *is* the `Separator` atom — see `atoms/Separator`;
 * `Divider` is the more general content-rule primitive, not this).
 *
 * Only the group's own radius + `overflow: hidden` clip produce the
 * rounded ends.
 *
 * Only `Button` children get the size cascade — anything else (a
 * separator, plain text) is left alone.
 *
 * Children stretch to the island's full interior height (Ray's
 * `.menu-button { height: 100% }`), so an island given an explicit
 * height grows its buttons to match instead of leaving dead space above
 * and below them. Button's `--stella-size-*` acts as a `min-height`, so
 * a free-standing island still sizes itself to its tallest child.
 *
 * A lone `Button` child additionally grows along the main axis
 * (`flex: 1`), so giving a single-button Island an explicit width — or
 * `alignSelf: 'stretch'` in a flex parent — makes the button fill it.
 *
 * @example
 * ```tsx
 * // The hairline between Cancel and Save is automatic — no Separator needed
 * <ButtonIsland size="sm">
 *   <Button>Cancel</Button>
 *   <Button>Save</Button>
 * </ButtonIsland>
 *
 * // ButtonIsland.Separator for an explicit sub-cluster break
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

    const sizedChildren = Children.map(children, (child) => {
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
        return cloneElement(
          child as React.ReactElement<{ size?: ButtonSize; className?: string }>,
          overrides
        );
      }
      return child;
    });

    return (
      <Island
        ref={ref}
        shape="pill"
        tone={tone}
        clip={clip}
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
 * ButtonIsland.Separator - re-exports the `Separator` atom as a
 * discoverable static on `ButtonIsland`, matching Ray IDE's dedicated
 * `Separator` atom for its `.menu-button-group` toolbar. Same component
 * either way — `import { Separator } from '@stella/terra'` works too.
 */
type ButtonIslandComponent = typeof ButtonIslandBase & {
  Separator: typeof Separator;
};

const ButtonIsland = ButtonIslandBase as ButtonIslandComponent;
ButtonIsland.Separator = Separator;

export { ButtonIsland };
export type { ButtonIslandProps };
