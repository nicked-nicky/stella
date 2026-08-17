import type { ReactNode } from 'react';

// ============================================================================
// SCHEMA — the "data" in data-driven
// ============================================================================

/**
 * Field types map 1:1 onto existing atoms — no settings-specific atom
 * was created for this. `text` renders an Input, `boolean` a Switch,
 * `choice` a Radio group (or a segmented ButtonIsland when
 * `control: 'segmented'`).
 */
export type SettingsFieldType = 'text' | 'boolean' | 'choice';

interface SettingsFieldBase {
  /** Unique within its category — used as the key into `SettingsValues`. */
  key: string;
  label: string;
  description?: string;
}

export interface SettingsTextField extends SettingsFieldBase {
  type: 'text';
  placeholder?: string;
}

export interface SettingsBooleanField extends SettingsFieldBase {
  type: 'boolean';
}

export interface SettingsChoiceOption {
  value: string;
  label: string;
  /** Optional icon (e.g. a Lucide icon wrapped in Terra's `Icon` atom),
   * rendered leading inside the segment button. */
  icon?: ReactNode;
}

export interface SettingsChoiceField extends SettingsFieldBase {
  type: 'choice';
  options: SettingsChoiceOption[];
  /**
   * Presentation for the choice.
   * - `'radio'` (default): vertical Radio list — most settings.
   * - `'segmented'`: horizontal ButtonIsland segmented control using
   *   Button's `active` state — for mutually-exclusive style picks
   *   (theme, rounding, density) where the GTK view-switcher look is
   *   wanted. The selected option reads as the inverted `active` fill.
   */
  control?: 'radio' | 'segmented';
}

export type SettingsField =
  | SettingsTextField
  | SettingsBooleanField
  | SettingsChoiceField;

export interface SettingsCategory {
  id: string;
  label: string;
  /** Consumer-supplied icon (e.g. a Lucide icon wrapped in Terra's `Icon` atom). */
  icon?: ReactNode;
  description?: string;
  fields: SettingsField[];
}

export interface SettingsSchema {
  categories: SettingsCategory[];
}

// ============================================================================
// VALUES — the actual data, fully controlled by the consumer
// ============================================================================

export type SettingsFieldValue = string | boolean;

/** `categoryId -> fieldKey -> value`. SettingsMenu never owns this —
 * you do, same principle as ThemeManager owning no persistence. */
export type SettingsValues = Record<string, Record<string, SettingsFieldValue>>;
