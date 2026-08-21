/** @format */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { useOverlayLayer } from '../../providers/OverlayProvider';
import { Button } from '../../atoms/Button';
import { ButtonIsland } from '../../molecules/ButtonIsland';
import { Text } from '../../atoms/Text';
import { getExitDelay } from '../../utils/motion';
import { FOCUSABLE_SELECTOR } from '../../utils/dom';
import { CloseIcon } from '../../utils/icons';
import styles from './Dialog.module.css';

/** Matches --stella-motion-fast — see Dialog.module.css's exit keyframes. */
const EXIT_DURATION_MS = 150;

// ============================================================================
// TYPES
// ============================================================================

export type DialogSize = 'sm' | 'md' | 'lg';

export interface DialogProps {
  /** Whether the dialog is open. Keep the dialog mounted and flip `open`
   *  to preserve its children's state across close/reopen. */
  open: boolean;
  /** Called when the user requests close: Escape, backdrop click, or the
   *  header close button. Omit to make the dialog dismiss-only via `open`. */
  onClose?: () => void;
  /** Maximum panel width.
   *  @default 'md' */
  size?: DialogSize;
  /** Close when the dimmed backdrop is clicked.
   *  @default true */
  closeOnBackdrop?: boolean;
  className?: string;
  children?: React.ReactNode;
}

interface DialogContextValue {
  titleId: string;
  descriptionId: string;
  onClose: (() => void) | undefined;
  registerTitle: () => void;
  unregisterTitle: () => void;
  registerDescription: () => void;
  unregisterDescription: () => void;
}

const DialogContext = createContext<DialogContextValue | undefined>(undefined);

function useDialogContext(): DialogContextValue {
  const ctx = useContext(DialogContext);
  if (!ctx) {
    throw new Error('Dialog subcomponents must be used inside <Dialog>.');
  }
  return ctx;
}

// ============================================================================
// ROOT
// ============================================================================

/**
 * Dialog - GTK4/libadwaita-style modal dialogue. A compound component:
 *
 * ```
 * <Dialog open onClose={...} size="lg">
 *   <Dialog.Header>
 *     <Dialog.Title>Title</Dialog.Title>
 *     <Dialog.Description>Optional subtitle</Dialog.Description>
 *   </Dialog.Header>
 *   <Dialog.Body>...</Dialog.Body>
 *   <Dialog.Footer>...</Dialog.Footer>
 * </Dialog>
 * ```
 *
 * Mounts into the shared OverlayProvider portal, so stacking order is
 * just DOM paint order - no manual z-index. Escape and backdrop-click
 * close are provided by useOverlayLayer (scoped to the topmost layer),
 * focus moves into the panel on open and back to the trigger on close,
 * and Tab is trapped inside the panel. The close button in the header
 * only renders when `onClose` is provided.
 *
 * Stays mounted for one more beat after `open` flips false, playing a
 * fade-out on the backdrop and panel before actually unmounting —
 * `open={false}` doesn't yank the dialog off-screen mid-animation, it
 * just starts the exit (see Dialog.module.css's `-out` keyframes and
 * the `getExitDelay`-timed unmount below).
 *
 * Keep the dialog mounted and flip `open` to retain its children's
 * state across close/reopen.
 */
export function Dialog({
  open,
  onClose,
  size = 'md',
  closeOnBackdrop = true,
  className,
  children,
}: DialogProps) {
  const { root } = useOverlayLayer({
    open,
    ...(onClose ? { onClose } : {}),
  });
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const [hasTitle, setHasTitle] = useState(false);
  const [hasDescription, setHasDescription] = useState(false);

  // Render lifecycle, independent of `open` itself: 'open' and 'closed'
  // are steady states, 'closing' is the transient beat where `open` has
  // already gone false but the exit animation is still playing and the
  // dialog must stay in the DOM to show it.
  const [renderState, setRenderState] = useState<'open' | 'closing' | 'closed'>(
    open ? 'open' : 'closed'
  );

  useEffect(() => {
    if (open) {
      setRenderState('open');
      return;
    }
    setRenderState((prev) => (prev === 'closed' ? 'closed' : 'closing'));
  }, [open]);

  // Only actually unmounts once the exit animation has had time to play.
  useEffect(() => {
    if (renderState !== 'closing') return;
    const timeout = setTimeout(
      () => setRenderState('closed'),
      getExitDelay(EXIT_DURATION_MS)
    );
    return () => clearTimeout(timeout);
  }, [renderState]);

  const registerTitle = useCallback(() => setHasTitle(true), []);
  const unregisterTitle = useCallback(() => setHasTitle(false), []);
  const registerDescription = useCallback(() => setHasDescription(true), []);
  const unregisterDescription = useCallback(() => setHasDescription(false), []);

  // Move focus into the dialog on open; hand it back to the trigger on close.
  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const raf = requestAnimationFrame(() => {
      const panel = panelRef.current;
      if (!panel) return;
      const first = panel.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      (first ?? panel).focus();
    });
    return () => {
      cancelAnimationFrame(raf);
      previouslyFocused.current?.focus?.();
    };
  }, [open]);

  const contextValue = useMemo<DialogContextValue>(
    () => ({
      titleId,
      descriptionId,
      onClose,
      registerTitle,
      unregisterTitle,
      registerDescription,
      unregisterDescription,
    }),
    [
      titleId,
      descriptionId,
      onClose,
      registerTitle,
      unregisterTitle,
      registerDescription,
      unregisterDescription,
    ]
  );

  const handleBackdropMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnBackdrop && event.target === event.currentTarget) {
      onClose?.();
    }
  };

  const handlePanelKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab') return;
    const panel = panelRef.current;
    if (!panel) return;
    const focusables = Array.from(
      panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
    );
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (!first || !last) return;
    const active = document.activeElement;
    if (event.shiftKey) {
      if (active === first || active === panel) {
        event.preventDefault();
        last.focus();
      }
    } else if (active === last || active === panel) {
      event.preventDefault();
      first.focus();
    }
  };

  if (renderState === 'closed' || !root) return null;

  const closing = renderState === 'closing';

  return createPortal(
    <div
      className={[styles.backdrop, closing && styles.closing]
        .filter(Boolean)
        .join(' ')}
      onMouseDown={handleBackdropMouseDown}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={hasTitle ? titleId : undefined}
        aria-describedby={hasDescription ? descriptionId : undefined}
        tabIndex={-1}
        onKeyDown={handlePanelKeyDown}
        className={[
          styles.panel,
          styles[`size-${size}`],
          closing && styles.closing,
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <DialogContext.Provider value={contextValue}>
          {children}
        </DialogContext.Provider>
      </div>
    </div>,
    root
  );
}

Dialog.displayName = 'Dialog';

// ============================================================================
// HEADER
// ============================================================================

function DialogHeader({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { onClose } = useDialogContext();
  return (
    <div
      className={[styles.header, className].filter(Boolean).join(' ')}
      {...props}
    >
      <div className={styles.headerTitle}>{children}</div>
      {onClose && (
        <ButtonIsland size="xs" tone="overlay">
          <Button iconOnly aria-label="Close dialog" onClick={onClose}>
            <CloseIcon />
          </Button>
        </ButtonIsland>
      )}
    </div>
  );
}

DialogHeader.displayName = 'Dialog.Header';

// ============================================================================
// TITLE / DESCRIPTION - register with the root for the dialog's aria
// references (aria-labelledby / aria-describedby).
// ============================================================================

function DialogTitle({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  const { titleId, registerTitle, unregisterTitle } = useDialogContext();
  useEffect(() => {
    registerTitle();
    return unregisterTitle;
  }, [registerTitle, unregisterTitle]);
  return (
    <Text id={titleId} variant="title-2" as="h2" className={className}>
      {children}
    </Text>
  );
}

DialogTitle.displayName = 'Dialog.Title';

function DialogDescription({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  const { descriptionId, registerDescription, unregisterDescription } =
    useDialogContext();
  useEffect(() => {
    registerDescription();
    return unregisterDescription;
  }, [registerDescription, unregisterDescription]);
  return (
    <Text
      id={descriptionId}
      variant="body"
      color="secondary"
      as="p"
      className={className}
    >
      {children}
    </Text>
  );
}

DialogDescription.displayName = 'Dialog.Description';

// ============================================================================
// BODY / FOOTER
// ============================================================================

function DialogBody({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={[styles.body, className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </div>
  );
}

DialogBody.displayName = 'Dialog.Body';

function DialogFooter({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={[styles.footer, className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </div>
  );
}

DialogFooter.displayName = 'Dialog.Footer';

Dialog.Header = DialogHeader;
Dialog.Title = DialogTitle;
Dialog.Description = DialogDescription;
Dialog.Body = DialogBody;
Dialog.Footer = DialogFooter;
