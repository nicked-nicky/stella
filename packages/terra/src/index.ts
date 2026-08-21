/**
 * @stella/terra — GTK 4 / libadwaita-inspired React UI kit
 *
 * Atoms (base components)
 */
export { Button, type ButtonProps, type ButtonSize } from './atoms/Button';
export {
  Badge,
  type BadgeProps,
  type BadgeVariant,
  type BadgeColor,
} from './atoms/Badge';
export {
  Checkbox,
  type CheckboxProps,
  type CheckboxSize,
} from './atoms/Checkbox';
export { Radio, type RadioProps, type RadioSize } from './atoms/Radio';
export { Switch, type SwitchProps, type SwitchSize } from './atoms/Switch';
export { Spinner, type SpinnerProps, type SpinnerSize } from './atoms/Spinner';
export { Avatar, type AvatarProps, type AvatarSize } from './atoms/Avatar';
export {
  Divider,
  type DividerProps,
  type DividerOrientation,
} from './atoms/Divider';
export {
  Input,
  type InputProps,
  type InputVariant,
  type InputSize,
} from './atoms/Input';
export { Icon, type IconProps, type IconSize } from './atoms/Icon';
export {
  Text,
  type TextProps,
  type TextVariant,
  type TextColor,
  type TextElement,
} from './atoms/Text';
export {
  Island,
  type IslandProps,
  type IslandShape,
  type IslandTone,
  type IslandElement,
} from './atoms/Island';

/**
 * Layout primitives
 */
export {
  FlexContainer,
  type FlexContainerProps,
  type FlexDirection,
  type FlexWrap,
  type FlexJustify,
  type FlexAlign,
  type FlexGap,
  type FlexElement,
} from './layout/FlexContainer';

/**
 * Molecules
 */
export { ButtonIsland, type ButtonIslandProps } from './molecules/ButtonIsland';
export {
  Notification,
  type NotificationProps,
  type NotificationVariant,
} from './molecules/Notification';
export { Tooltip, type TooltipProps } from './molecules/Tooltip';
export {
  WindowControls,
  type WindowControlsProps,
  type WindowControlsHandlers,
} from './molecules/WindowControls';

/**
 * Organisms
 */
export { Dialog, type DialogProps, type DialogSize } from './organisms/Dialog';
export {
  SettingsMenu,
  type SettingsMenuProps,
  type SettingsSchema,
  type SettingsCategory,
  type SettingsField,
  type SettingsFieldType,
  type SettingsTextField,
  type SettingsBooleanField,
  type SettingsChoiceField,
  type SettingsChoiceOption,
  type SettingsValues,
  type SettingsFieldValue,
} from './organisms/SettingsMenu';
export { Popover, type PopoverProps } from './organisms/Popover';
export { Menu, type MenuProps, type MenuItemProps } from './organisms/Menu';
export { WindowChrome, type WindowChromeProps } from './organisms/WindowChrome';

/**
 * Hooks — the building blocks Tooltip/Popover/Menu are made of, also
 * exported directly for anyone composing a new anchored/dismissable
 * overlay type of their own (same escape hatch `useOverlayLayer` is,
 * for OverlayProvider).
 */
export {
  useAnchorPosition,
  pointAnchor,
  useClickOutside,
  useDismissableOverlay,
  type Anchor,
  type VirtualAnchor,
  type Placement,
  type UseAnchorPositionOptions,
  type UseAnchorPositionResult,
  type UseDismissableOverlayOptions,
  type UseDismissableOverlayResult,
} from './hooks';

/**
 * Providers — app-level systems (theming, overlay stacking,
 * notifications). Wrap these around your app root; everything else in
 * the kit is runtime-agnostic and needs none of them to function.
 */
export {
  OverlayProvider,
  useOverlayContext,
  useOverlayLayer,
} from './providers/OverlayProvider';
export {
  NotificationProvider,
  useNotifications,
} from './providers/NotificationProvider';
export { ThemeProvider, useTheme } from './providers/ThemeProvider';

/**
 * Theme engine — the framework-agnostic class behind ThemeProvider.
 * Most consumers only need ThemeProvider/useTheme; this is exposed for
 * anyone wiring theming outside React, or building custom bindings.
 */
export {
  ThemeManager,
  DEFAULT_THEME_CONFIG,
  type ThemeConfig,
  type ColorScheme,
  type RadiusStyle,
  type Density,
  type BorderWidthStyle,
} from './theme';
