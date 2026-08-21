import { Icon } from '../../atoms/Icon';
import { PaletteIcon, SunIcon, MoonIcon, MonitorIcon } from '../../utils/icons';
import type {
  ColorScheme,
  RadiusStyle,
  Density,
  BorderWidthStyle,
  MotionStyle,
  ThemeConfig,
} from '../../theme/ThemeManager';
import type { SettingsCategory, SettingsFieldValue } from './types';

// ============================================================================
// PRE-BUILT APPEARANCE CATEGORY
//
// SettingsMenu itself is fully generic — it has no idea ThemeManager
// exists. This file is the one place that bridges the two: a ready-made
// `SettingsCategory` covering every axis ThemeManager exposes
// (colorScheme/radius/density/borderWidth/motion), plus the two small
// adapter functions a consumer needs to wire it to `useTheme()` without
// hand-rolling the same schema every app built on Terra would otherwise
// duplicate (this is exactly what terra-test's SettingsModal used to do
// before this file existed).
//
// Fully optional and fully composable — spread `appearanceSettingsCategory`
// into your own `SettingsSchema.categories` alongside whatever app-specific
// categories (General, Notifications, ...) you write yourself:
//
// ```tsx
// const schema: SettingsSchema = {
//   categories: [appearanceSettingsCategory, myGeneralCategory],
// };
//
// const values: SettingsValues = {
//   appearance: getAppearanceValues(theme.config),
//   general: myGeneralValues,
// };
//
// function handleChange(categoryId: string, key: string, value: SettingsFieldValue) {
//   if (categoryId === 'appearance') return applyAppearanceChange(theme, key, value);
//   // ...your own categories
// }
// ```
// ============================================================================

export const appearanceSettingsCategory: SettingsCategory = {
  id: 'appearance',
  label: 'Appearance',
  icon: (
    <Icon>
      <PaletteIcon />
    </Icon>
  ),
  description:
    'Backed by ThemeManager — these fields change the real theme live, no local state involved.',
  fields: [
    {
      key: 'colorScheme',
      type: 'choice',
      control: 'segmented',
      label: 'Color scheme',
      options: [
        { value: 'light', label: 'Light', icon: <SunIcon /> },
        { value: 'dark', label: 'Dark', icon: <MoonIcon /> },
        { value: 'system', label: 'System', icon: <MonitorIcon /> },
      ],
    },
    {
      key: 'radius',
      type: 'choice',
      control: 'segmented',
      label: 'Rounding',
      description:
        'Scales every corner radius token together — sharp (0.5×), default (1×), round (1.5×).',
      options: [
        { value: 'sharp', label: 'Sharp' },
        { value: 'default', label: 'Default' },
        { value: 'round', label: 'Round' },
      ],
    },
    {
      key: 'density',
      type: 'choice',
      control: 'segmented',
      label: 'Density',
      description: 'Scales every spacing/padding token together.',
      options: [
        { value: 'compact', label: 'Compact' },
        { value: 'default', label: 'Default' },
        { value: 'comfortable', label: 'Comfortable' },
      ],
    },
    {
      key: 'borderWidth',
      type: 'choice',
      control: 'segmented',
      label: 'Border thickness',
      description:
        'Sets --stella-border-width directly — every hairline in Terra reads this one token. None is a genuine borderless mode, not just a thinner one.',
      options: [
        { value: 'none', label: 'None' },
        { value: 'thin', label: 'Thin' },
        { value: 'default', label: 'Default' },
        { value: 'thick', label: 'Thick' },
      ],
    },
    {
      key: 'motion',
      type: 'choice',
      control: 'segmented',
      label: 'Motion',
      description:
        "System defers to your OS's reduce-motion setting. Reduced forces near-zero durations regardless of OS setting. Off removes every animation/transition outright — Spinner keeps spinning either way, so loading states never look hung.",
      options: [
        { value: 'system', label: 'System' },
        { value: 'reduced', label: 'Reduced' },
        { value: 'off', label: 'Off' },
      ],
    },
  ],
};

/** The slice of `ThemeConfig` the Appearance category's fields cover — every axis except the persistence-schema `version`. */
export type AppearanceSettingsValues = Omit<ThemeConfig, 'version'>;

/** Projects a `ThemeConfig` into the `SettingsValues['appearance']` shape SettingsMenu expects. */
export function getAppearanceValues(
  config: ThemeConfig
): AppearanceSettingsValues {
  const { version: _version, ...values } = config;
  return values;
}

/**
 * The subset of `ThemeManager`'s (or `useTheme()`'s) setters
 * `applyAppearanceChange` needs. Structural, not a concrete class/context
 * type, so either a raw `ThemeManager` instance or a `useTheme()` result
 * satisfies it without adapting.
 */
export interface AppearanceThemeControls {
  setColorScheme: (colorScheme: ColorScheme) => void;
  setRadius: (radius: RadiusStyle) => void;
  setDensity: (density: Density) => void;
  setBorderWidth: (borderWidth: BorderWidthStyle) => void;
  setMotion: (motion: MotionStyle) => void;
}

/**
 * Routes one `appearanceSettingsCategory` field change to the matching
 * ThemeManager setter. Call this from your `SettingsMenu`'s `onChange`
 * once you've confirmed `categoryId === 'appearance'` — unknown keys are
 * a silent no-op rather than a throw, since a future field added here
 * shouldn't crash an app pinned to an older Terra version reading it.
 */
export function applyAppearanceChange(
  theme: AppearanceThemeControls,
  key: string,
  value: SettingsFieldValue
): void {
  switch (key) {
    case 'colorScheme':
      theme.setColorScheme(value as ColorScheme);
      break;
    case 'radius':
      theme.setRadius(value as RadiusStyle);
      break;
    case 'density':
      theme.setDensity(value as Density);
      break;
    case 'borderWidth':
      theme.setBorderWidth(value as BorderWidthStyle);
      break;
    case 'motion':
      theme.setMotion(value as MotionStyle);
      break;
  }
}
