import React, {
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { useOverlayLayer } from '../../providers/OverlayProvider';
import { useAnchorPosition } from '../../hooks';
import type { Placement } from '../../hooks';
import { mergeRefs } from '../../utils/mergeRefs';
import styles from './Tooltip.module.css';

// ============================================================================
// TYPES
// ============================================================================

export interface TooltipProps {
  /** Trigger element — cloned to attach a ref and the hover/focus
   * handlers, so it must accept a ref (a DOM element or a forwardRef
   * component; every Terra atom qualifies). */
  children: React.ReactElement;
  /** Tooltip content. */
  label: React.ReactNode;
  /** @default 'top' */
  placement?: Placement;
  /** Hover/focus delay before showing, in ms. Hides immediately on
   * mouse-leave/blur — only the show is throttled, matching a native
   * `title` attribute's feel rather than adding a symmetrical hide
   * delay nothing asked for.
   * @default 400 */
  delay?: number;
  /** @default false */
  disabled?: boolean;
}

// ============================================================================
// INTERNAL — compose an added handler onto whatever the trigger already had
// ============================================================================

function composeHandlers<E>(
  original: ((event: E) => void) | undefined,
  added: (event: E) => void
) {
  return (event: E) => {
    original?.(event);
    added(event);
  };
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Tooltip - hover/focus-triggered label, anchored to its trigger via
 * `useAnchorPosition`. Purely informational — no focus trap, no
 * click-outside handling (nothing to click, it's `pointer-events:
 * none`), Escape just hides it early via `useOverlayLayer`'s built-in
 * handling. Deliberately lighter-weight than `Popover`/`Menu`: mounts
 * and unmounts immediately with `open`, no exit-animation delay
 * machinery — a tooltip popping away a beat early on a fast
 * mouse-leave is unnoticeable, and skipping that state machine keeps
 * this small.
 *
 * @example
 * ```tsx
 * <Tooltip label="Save changes">
 *   <Button iconOnly aria-label="Save"><SaveIcon /></Button>
 * </Tooltip>
 * ```
 */
export function Tooltip({
  children,
  label,
  placement = 'top',
  delay = 400,
  disabled = false,
}: TooltipProps) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLElement | null>(null);
  // Explicit initial value: React 19's types made useRef's argument
  // required, so the bare `useRef<T>()` this used to be no longer
  // compiles. Same runtime behaviour.
  const showTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );
  const tooltipId = useId();

  const handleClose = useCallback(() => setOpen(false), []);
  const { root } = useOverlayLayer({ open, onClose: handleClose });
  const { panelRef, style } = useAnchorPosition({
    open,
    anchor: anchorRef.current,
    placement,
    offset: 6,
  });

  const show = useCallback(() => {
    if (disabled) return;
    clearTimeout(showTimer.current);
    showTimer.current = setTimeout(() => setOpen(true), delay);
  }, [disabled, delay]);

  const hide = useCallback(() => {
    clearTimeout(showTimer.current);
    setOpen(false);
  }, []);

  useEffect(() => () => clearTimeout(showTimer.current), []);

  if (!isValidElement(children)) return children;

  // `children` is typed as ReactElement (props: unknown), so cloneElement
  // resolves its props parameter to `Partial<unknown> & Attributes`,
  // which accepts neither `ref` nor arbitrary handlers. Narrowing the
  // element's prop type here is what makes the clone below typecheck —
  // the runtime behaviour is unchanged.
  const child = children as React.ReactElement<Record<string, unknown>> & {
    ref?: React.Ref<HTMLElement>;
  };
  const childProps = child.props as Record<string, unknown>;

  // Terra peers `react >=18` and develops against 19, and the two put a
  // cloned element's existing ref in different places: 19 moved it into
  // props, 18 keeps it on the element. Branching on the version rather
  // than probing both is deliberate — reading `element.ref` on React 19
  // logs a deprecation warning, so a "try props, fall back to element"
  // shape would warn on every tooltip whose trigger has no ref of its own.
  const childRef =
    Number.parseInt(React.version, 10) >= 19
      ? (childProps.ref as React.Ref<HTMLElement> | undefined)
      : child.ref;

  const trigger = cloneElement(child, {
    ref: mergeRefs(anchorRef, childRef),
    onMouseEnter: composeHandlers(
      childProps.onMouseEnter as (e: React.MouseEvent) => void,
      show
    ),
    onMouseLeave: composeHandlers(
      childProps.onMouseLeave as (e: React.MouseEvent) => void,
      hide
    ),
    onFocus: composeHandlers(
      childProps.onFocus as (e: React.FocusEvent) => void,
      show
    ),
    onBlur: composeHandlers(
      childProps.onBlur as (e: React.FocusEvent) => void,
      hide
    ),
    'aria-describedby': open
      ? [childProps['aria-describedby'], tooltipId].filter(Boolean).join(' ')
      : childProps['aria-describedby'],
  });

  return (
    <>
      {trigger}
      {open &&
        root &&
        createPortal(
          <div
            ref={panelRef}
            id={tooltipId}
            role="tooltip"
            className={styles.tooltip}
            style={style}
          >
            {label}
          </div>,
          root
        )}
    </>
  );
}

Tooltip.displayName = 'Tooltip';
