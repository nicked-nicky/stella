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
// dismiss button, and (Palette/Sun/Moon/Monitor below) the pre-built
// `appearanceSettingsCategory` schema in organisms/SettingsMenu. Single
// source of truth so a close glyph drawn once doesn't quietly drift into
// two or three slightly-different inline copies (which is exactly what
// had happened: Dialog, WindowControls, and Notification each carried
// their own hand-rolled X).
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

export function PaletteIcon() {
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
        d="M8 2a6 6 0 1 0 0 12c.73 0 1.07-.6.8-1.27-.2-.46.13-.93.66-.93H10.67a2.67 2.67 0 0 0 2.66-2.67C13.33 5.5 10.9 2 8 2Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <circle cx="5.2" cy="7" r="0.85" fill="currentColor" />
      <circle cx="7.7" cy="4.7" r="0.85" fill="currentColor" />
      <circle cx="10.5" cy="6.3" r="0.85" fill="currentColor" />
    </svg>
  );
}

export function SunIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="100%"
      height="100%"
      fill="none"
      style={{ display: 'block' }}
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="2.75" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M8 1.5v1.3M8 13.2v1.3M2.4 8h1.3M12.3 8h1.3M3.9 3.9l.9.9M11.2 11.2l.9.9M3.9 12.1l.9-.9M11.2 4.8l.9-.9"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function MoonIcon() {
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
        d="M13.5 9.75A5.5 5.5 0 1 1 6.25 2.5a4.5 4.5 0 0 0 7.25 7.25Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function MonitorIcon() {
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
        x="1.5"
        y="3"
        width="13"
        height="8.5"
        rx="1.3"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="M5.5 14h5M8 11.5V14"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
