import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ThemeManager } from '../../theme/ThemeManager';
import type {
  ThemeConfig,
  ColorScheme,
  RadiusStyle,
  Density,
  BorderWidthStyle,
} from '../../theme/ThemeManager';

// ============================================================================
// TYPES
// ============================================================================

interface ThemeContextValue {
  /** Current theme config — re-renders your components on change. */
  config: ThemeConfig;
  setColorScheme: (colorScheme: ColorScheme) => void;
  /** Rounding preset — scales every radius token together. */
  setRadius: (radius: RadiusStyle) => void;
  /** Density preset — scales every spacing token together. */
  setDensity: (density: Density) => void;
  /** Border thickness preset — sets --stella-border-width directly. */
  setBorderWidth: (borderWidth: BorderWidthStyle) => void;
  /** Snapshot for your own save routine — see ThemeProvider's docstring. */
  getConfig: () => ThemeConfig;
  /** Apply a config loaded from your own save routine. */
  loadConfig: (config: Partial<ThemeConfig>) => void;
}

interface ThemeProviderProps {
  children: React.ReactNode;
  /**
   * Initial theme — pass in whatever you loaded from your own saved
   * config before first render. Omit to start from Terra's defaults
   * (system color scheme, default rounding/density).
   */
  defaultConfig?: Partial<ThemeConfig>;
  /**
   * Fires on every theme change with the new config. This is where you
   * wire your own save call (Tauri fs write, Electron IPC, etc.) —
   * Stella-Componente never persists anything itself.
   */
  onChange?: (config: ThemeConfig) => void;
}

// ============================================================================
// CONTEXT
// ============================================================================

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// ============================================================================
// PROVIDER
// ============================================================================

/**
 * ThemeProvider - React binding for `ThemeManager`.
 *
 * Wrap your app root once. Everything downstream reads color scheme /
 * rounding / density / border thickness purely through CSS custom
 * properties, so most
 * components never need `useTheme()` at all — it's for whatever
 * actually lets the user *change* the theme (a settings panel) and for
 * your own save/load wiring.
 *
 * @example
 * ```tsx
 * <ThemeProvider
 *   defaultConfig={loadedFromDisk}
 *   onChange={(config) => tauriFs.writeTextFile('theme.json', JSON.stringify(config))}
 * >
 *   <App />
 * </ThemeProvider>
 * ```
 */
export function ThemeProvider({
  children,
  defaultConfig,
  onChange,
}: ThemeProviderProps) {
  const managerRef = useRef<ThemeManager | null>(null);
  if (!managerRef.current) {
    managerRef.current = new ThemeManager(
      document.documentElement,
      defaultConfig
    );
  }

  const [config, setConfig] = useState<ThemeConfig>(() =>
    managerRef.current!.getConfig()
  );

  // Keep the latest onChange without needing to resubscribe every render.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const unsubscribe = managerRef.current!.subscribe((next) => {
      setConfig(next);
      onChangeRef.current?.(next);
    });
    return unsubscribe;
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      config,
      setColorScheme: (colorScheme) =>
        managerRef.current!.setColorScheme(colorScheme),
      setRadius: (radius) => managerRef.current!.setRadius(radius),
      setDensity: (density) => managerRef.current!.setDensity(density),
      setBorderWidth: (borderWidth) =>
        managerRef.current!.setBorderWidth(borderWidth),
      getConfig: () => managerRef.current!.getConfig(),
      loadConfig: (c) => managerRef.current!.loadConfig(c),
    }),
    [config]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

/** Access and control the current theme. Must be used within a `ThemeProvider`. */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a <ThemeProvider>.');
  }
  return ctx;
}
