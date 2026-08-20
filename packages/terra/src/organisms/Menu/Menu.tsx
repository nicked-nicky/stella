import React, { Children, createContext, isValidElement, useContext, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useDismissableOverlay } from '../../hooks';
import type { Anchor, Placement } from '../../hooks';
import { Island } from '../../atoms/Island';
import { Divider } from '../../atoms/Divider';
import styles from './Menu.module.css';

const ITEM_SELECTOR = '[role="menuitem"]:not(:disabled)';
const TYPEAHEAD_RESET_MS = 500;

// ============================================================================
// TYPES
// ============================================================================

export interface MenuProps {
  /** Whether the menu is open. */
  open: boolean;
  /** Called on Escape/Tab (topmost layer only), an outside click, or
   * an item select (unless that item opts out via `closeOnSelect`). */
  onClose?: () => void;
  /** Trigger element for a dropdown menu, or a virtual point from
   * `pointAnchor(event.clientX, event.clientY)` for a right-click
   * context menu. */
  anchor: Anchor | null;
  /** @default 'bottom-start' */
  placement?: Placement;
  /** Gap between anchor and panel, in px — tighter than Popover's
   * default by design, so a dropdown reads as attached to its trigger.
   * @default 4 */
  offset?: number;
  className?: string;
  children?: React.ReactNode;
}

interface MenuContextValue {
  onClose: () => void;
}

// ============================================================================
// CONTEXT
// ============================================================================

const MenuContext = createContext<MenuContextValue | undefined>(undefined);

function useMenuContext(): MenuContextValue {
  const ctx = useContext(MenuContext);
  if (!ctx) {
    throw new Error('Menu subcomponents must be used inside <Menu>.');
  }
  return ctx;
}

// ============================================================================
// ROOT
// ============================================================================

/**
 * Menu - anchored list of actions (dropdown menu or right-click
 * context menu, same component either way — the only difference is
 * what `anchor` points to). A compound component:
 *
 * ```
 * <Menu open={open} onClose={close} anchor={anchor}>
 *   <Menu.Item leadingIcon={<Copy />} onSelect={handleCopy}>Copy</Menu.Item>
 *   <Menu.Item disabled>Paste</Menu.Item>
 *   <Menu.Separator />
 *   <Menu.Item destructive onSelect={handleDelete}>Delete</Menu.Item>
 * </Menu>
 * ```
 *
 * Same visual pattern as `ButtonIsland`: the panel owns all the
 * rounding, items are square and flush, and the hairline between them
 * is a real auto-inserted `Divider` (`Menu.Separator` for a deliberate
 * group break instead). See WIKI.md's Architecture reference.
 *
 * Same `useDismissableOverlay` as `Popover` for portal/stacking/Escape/
 * anchor-position/outside-click/focus-management, plus WAI-ARIA menu
 * keyboard behavior: ↑/↓ moves focus (wrapping), Home/End jump to the
 * ends, typing jumps to a matching label, Tab closes the menu. Reads
 * the item list from the DOM at keydown time rather than a parallel
 * registration context — items are always real `<button>`s in DOM
 * order, so this is simpler and exactly correct.
 *
 * `Menu.Item`'s `active` prop (same meaning as `Button`'s) is what a
 * future `Select`/`Dropdown` would build on.
 *
 * @example
 * ```tsx
 * // Dropdown, anchored to a trigger button
 * const triggerRef = useRef<HTMLButtonElement>(null);
 * <Button ref={triggerRef} onClick={() => setOpen(true)}>Actions</Button>
 * <Menu open={open} onClose={() => setOpen(false)} anchor={triggerRef.current}>
 *   ...
 * </Menu>
 *
 * // Context menu, anchored to the cursor
 * <div onContextMenu={(e) => {
 *   e.preventDefault();
 *   setAnchor(pointAnchor(e.clientX, e.clientY));
 *   setOpen(true);
 * }}>
 * ```
 */
export function Menu({
  open,
  onClose,
  anchor,
  placement = 'bottom-start',
  offset = 4,
  className,
  children,
}: MenuProps) {
  const typeahead = useRef<{ buffer: string; timer: ReturnType<typeof setTimeout> | undefined }>({
    buffer: '',
    timer: undefined,
  });

  const { root, panelRef, style, requestClose } = useDismissableOverlay({
    open,
    onClose,
    anchor,
    placement,
    offset,
    initialFocusSelector: ITEM_SELECTOR,
  });

  // Item select restores focus to the trigger, same as Escape — see
  // `requestClose`'s docs on the restore/don't-restore distinction.
  const contextValue = useMemo<MenuContextValue>(
    () => ({ onClose: () => requestClose(true) }),
    [requestClose]
  );

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    const panel = panelRef.current;
    if (!panel) return;
    const items = Array.from(panel.querySelectorAll<HTMLElement>(ITEM_SELECTOR));
    if (items.length === 0) return;
    const currentIndex = items.indexOf(document.activeElement as HTMLElement);

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        items[(currentIndex + 1 + items.length) % items.length]?.focus();
        return;
      case 'ArrowUp':
        event.preventDefault();
        items[(currentIndex - 1 + items.length) % items.length]?.focus();
        return;
      case 'Home':
        event.preventDefault();
        items[0]?.focus();
        return;
      case 'End':
        event.preventDefault();
        items[items.length - 1]?.focus();
        return;
      case 'Tab':
        // Native menus close rather than let Tab wander through their
        // items — leaving focus wherever it already is, so it lands on
        // whatever comes next in the surrounding page's tab order.
        requestClose(false);
        return;
      default:
        if (event.key.length === 1 && /\S/.test(event.key)) {
          const state = typeahead.current;
          clearTimeout(state.timer);
          state.buffer += event.key.toLowerCase();
          const match = items.find((item) =>
            item.textContent?.trim().toLowerCase().startsWith(state.buffer)
          );
          match?.focus();
          state.timer = setTimeout(() => {
            state.buffer = '';
          }, TYPEAHEAD_RESET_MS);
        }
    }
  };

  if (!open || !root) return null;

  // Built up by hand rather than mapped 1:1 — inserting the auto-
  // hairline `Divider` between Menu.Item pairs means the output array
  // is longer than the input. Same approach as ButtonIsland.tsx's
  // `sizedChildren`.
  const itemArray = Children.toArray(children);
  const content: React.ReactNode[] = [];
  itemArray.forEach((child, index) => {
    content.push(child);

    // Auto-hairline: a real Divider between this item and the next,
    // only when the next sibling is also a bare Menu.Item — an
    // explicit Menu.Separator the caller already placed here shouldn't
    // get a second one stacked next to it.
    const next = itemArray[index + 1];
    if (
      isValidElement(child) &&
      child.type === MenuItem &&
      isValidElement(next) &&
      next.type === MenuItem
    ) {
      content.push(
        <Divider key={`${child.key ?? index}-hairline`} className={styles.autoSeparator} />
      );
    }
  });

  return createPortal(
    <div ref={panelRef} style={style}>
      <Island
        shape="panel"
        tone="overlay"
        role="menu"
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className={[styles.menu, className].filter(Boolean).join(' ')}
      >
        <MenuContext.Provider value={contextValue}>{content}</MenuContext.Provider>
      </Island>
    </div>,
    root
  );
}

Menu.displayName = 'Menu';

// ============================================================================
// ITEM
// ============================================================================

export interface MenuItemProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onSelect'> {
  /** Fired on click or Enter/Space (native `<button>` behavior). */
  onSelect?: () => void;
  /** Status-red text, for a destructive action — the same red used
   * everywhere else status color appears in Stella (see tokens.css),
   * not a one-off. */
  destructive?: boolean;
  /** Persistent "selected" mark — same meaning as `Button`'s `active`.
   * What a `Select`/`Dropdown` built on `Menu` would set on the item
   * matching the current value. */
  active?: boolean;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  /** @default true */
  closeOnSelect?: boolean;
  children?: React.ReactNode;
}

function MenuItem({
  onSelect,
  destructive = false,
  active = false,
  leadingIcon,
  trailingIcon,
  closeOnSelect = true,
  disabled,
  className,
  children,
  onClick,
  ...props
}: MenuItemProps) {
  const { onClose } = useMenuContext();

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
    if (disabled) return;
    onSelect?.();
    if (closeOnSelect) onClose();
  };

  return (
    <button
      type="button"
      role="menuitem"
      tabIndex={-1}
      disabled={disabled}
      data-destructive={destructive || undefined}
      data-active={active || undefined}
      className={[styles.item, className].filter(Boolean).join(' ')}
      onClick={handleClick}
      {...props}
    >
      {leadingIcon && (
        <span className={styles.itemIcon} aria-hidden="true">
          {leadingIcon}
        </span>
      )}
      <span className={styles.itemLabel}>{children}</span>
      {trailingIcon && (
        <span className={styles.itemIcon} aria-hidden="true">
          {trailingIcon}
        </span>
      )}
    </button>
  );
}

MenuItem.displayName = 'Menu.Item';

// ============================================================================
// SEPARATOR — reuses the Divider atom directly at its default
// `horizontal` orientation, exposed as a discoverable static (same move
// ButtonIsland.Separator makes, pinned to `vertical` instead). No custom
// color/inset needed — with `.menu` flush (zero padding), Divider's own
// default full-bleed styling gives it a clearly stronger line than the
// subtle per-item hairline above, so a real group break still reads as
// one rather than blending into it.
// ============================================================================

Menu.Item = MenuItem;
Menu.Separator = Divider;
