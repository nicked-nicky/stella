import React from 'react';

// ============================================================================
// SYMBOLIC SVG GLYPHS
//
// Terra is otherwise icon-agnostic — Notification's `icon` prop, Button's
// `leadingIcon`/`trailingIcon`, etc. all take consumer-supplied content, no
// bundled icon library (see project principle: Terra stays thin). This file
// is the one exception: the handful of chrome-level glyphs Terra's own
// built-in controls need regardless of what icon library (if any) the
// consumer uses — window controls, Dialog's close button, Notification's
// dismiss button. Single source of truth so a close glyph drawn once
// doesn't quietly drift into two or three slightly-different inline copies
// (which is exactly what had happened: Dialog, WindowControls, and
// Notification each carried their own hand-rolled X).
//
// All render at a 16x16 viewBox, scaled to fill their container via
// `width`/`height="100%"` — not a fixed pixel size — so they scale
// correctly inside any Button `.icon` slot regardless of Button `size`
// (see styles/shared/controlIcon.module.css's `1.25em` sizing; a fixed
// 16px glyph doesn't track that). `display: block` on each avoids the
// inline-SVG baseline gap that would otherwise nudge the glyph a pixel or
// two off-center within its centered flex container.
// ============================================================================

export function CloseIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="100%"
      height="100%"
      fill="none"
      style={{ display: 'block' }}
      aria-hidden="true"
    >
      <path
        d="M4 4l8 8M12 4l-8 8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function MinimizeIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="100%"
      height="100%"
      fill="none"
      style={{ display: 'block' }}
      aria-hidden="true"
    >
      <path
        d="M4 8H12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function MaximizeIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="100%"
      height="100%"
      fill="none"
      style={{ display: 'block' }}
      aria-hidden="true"
    >
      <rect
        x="3.5"
        y="3.5"
        width="9"
        height="9"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function RestoreIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="100%"
      height="100%"
      fill="none"
      style={{ display: 'block' }}
      aria-hidden="true"
    >
      <path
        d="M5.5 5.5V3.5H12.5V10.5H10.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x="3.5"
        y="5.5"
        width="7"
        height="7"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}
