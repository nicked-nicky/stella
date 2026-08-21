// ============================================================================
// TYPES
// ============================================================================

export type ColorScheme = 'light' | 'dark' | 'system';

/**
 * Rounding preset — scales `--stella-radius-panel`, the single radius
 * every component in Terra reads, via `--stella-radius-scale` (see
 * tokens.css). Because it's the one value everything shares, this
 * preset now visibly reshapes the whole kit at once — avatars, switch
 * thumbs, and radio dots included, not just panels/dialogs — rather
 * than the small set of container radii it used to touch.
 */
export type RadiusStyle = 'sharp' | 'default' | 'round';

/**
 * Density preset — scales every `--stella-space-*` step together via
 * `--stella-space-scale` (see tokens.css), tightening or loosening
 * padding/gaps app-wide from one setting.
 */
export type Density = 'compact' | 'default' | 'comfortable';

/**
 * Border thickness preset — writes `--stella-border-width` directly
 * (see tokens.css). Unlike radius/density there's only ever one token
 * to move, so this skips the multiplier-scale indirection those two
 * use and just sets the pixel value straight — hairline widths don't
 * subdivide cleanly, so each step is an explicit whole pixel rather
 * than a fraction of a base value.
 *
 * `none` writes `0px` — every hairline in Terra (Island, Button,
 * Badge, Checkbox, Radio, Switch, Dialog, Divider, ...) reads the
 * same token, so this is a genuine borderless mode, not just a thinner
 * one. Components that lean on their border for shape legibility
 * against the background (an unchecked Checkbox, say) fall back on
 * their background/shadow alone at `none` — that's the expected
 * tradeoff of asking for no borders, not a bug to work around per
 * component.
 */
export type BorderWidthStyle = 'none' | 'thin' | 'default' | 'thick';

export interface ThemeConfig {
  /** Schema version — bump when the shape changes so `loadConfig` can
   * reason about migrating older saved configs. */
  version: 4;
  colorScheme: ColorScheme;
  radius: RadiusStyle;
  density: Density;
  borderWidth: BorderWidthStyle;
}

export const DEFAULT_THEME_CONFIG: ThemeConfig = {
  version: 4,
  colorScheme: 'system',
  radius: 'default',
  density: 'default',
  borderWidth: 'default',
};

type ThemeChangeListener = (config: ThemeConfig) => void;

/** Multiplier each RadiusStyle preset writes to --stella-radius-scale. */
const RADIUS_SCALE: Record<RadiusStyle, string> = {
  sharp: '0.5',
  default: '1',
  round: '1.5',
};

/** Multiplier each Density preset writes to --stella-space-scale. */
const DENSITY_SCALE: Record<Density, string> = {
  compact: '0.85',
  default: '1',
  comfortable: '1.15',
};

/** Pixel value each BorderWidthStyle preset writes to --stella-border-width. */
const BORDER_WIDTH: Record<BorderWidthStyle, string> = {
  none: '0px',
  thin: '1px',
  default: '2px',
  thick: '3px',
};

// ============================================================================
// CLASS
// ============================================================================

/**
 * ThemeManager - the engine behind Terra's theming.
 *
 * Stella has a single neutral color scheme — no runtime-switchable
 * accent hue (see tokens.css's docblock). ThemeManager's job is
 * narrower than it used to be: whether `data-theme` is forced
 * light/dark or left to `prefers-color-scheme` ("system"), the
 * rounding/density style-scale multipliers, and border thickness. Plain
 * CSS custom property writes on a root element — no React import
 * anywhere in this file, so a future non-React binding (Vue, Web
 * Components) could reuse it unchanged (see project principle:
 * React-first, don't paint into a corner).
 *
 * **Persistence is deliberately out of scope.** `getConfig()` and
 * `loadConfig()` are the entire save/load contract — this class never
 * touches localStorage, a filesystem, or an IPC channel. Where and how
 * the config gets saved is the host application's job: Tauri's `fs`
 * plugin, an Electron IPC round-trip to the main process, a plain web
 * app's `localStorage`, anything else. Stella doesn't know or care
 * which webview host it's running in — that boundary is intentional.
 *
 * @example
 * ```ts
 * const theme = new ThemeManager();
 * theme.setColorScheme('dark');
 * theme.setRadius('round');
 * theme.setBorderWidth('thick');
 *
 * // Save (however your runtime does it):
 * const json = JSON.stringify(theme.getConfig());
 * await tauriFs.writeTextFile('theme.json', json);
 *
 * // Load, on next launch:
 * const saved = JSON.parse(await tauriFs.readTextFile('theme.json'));
 * theme.loadConfig(saved);
 * ```
 */
export class ThemeManager {
  private root: HTMLElement;
  private config: ThemeConfig;
  private listeners = new Set<ThemeChangeListener>();

  constructor(
    root: HTMLElement = document.documentElement,
    initial?: Partial<ThemeConfig>
  ) {
    this.root = root;
    this.config = { ...DEFAULT_THEME_CONFIG, ...initial };
    this.applyColorScheme(this.config.colorScheme);
    this.applyRadius(this.config.radius);
    this.applyDensity(this.config.density);
    this.applyBorderWidth(this.config.borderWidth);
  }

  /**
   * Current config as a plain, JSON-serializable object. Safe to
   * `JSON.stringify` directly and hand to your own save routine.
   */
  getConfig(): ThemeConfig {
    return { ...this.config };
  }

  setColorScheme(colorScheme: ColorScheme): void {
    this.config = { ...this.config, colorScheme };
    this.applyColorScheme(colorScheme);
    this.notify();
  }

  setRadius(radius: RadiusStyle): void {
    this.config = { ...this.config, radius };
    this.applyRadius(radius);
    this.notify();
  }

  setDensity(density: Density): void {
    this.config = { ...this.config, density };
    this.applyDensity(density);
    this.notify();
  }

  setBorderWidth(borderWidth: BorderWidthStyle): void {
    this.config = { ...this.config, borderWidth };
    this.applyBorderWidth(borderWidth);
    this.notify();
  }

  /**
   * Apply a config loaded from wherever you persisted it. Accepts a
   * partial object — missing keys keep their current value rather than
   * resetting to the default, so a config saved before a new field
   * existed doesn't need manual migration for that field.
   */
  loadConfig(config: Partial<ThemeConfig>): void {
    this.config = {
      ...this.config,
      ...config,
      version: DEFAULT_THEME_CONFIG.version,
    };
    this.applyColorScheme(this.config.colorScheme);
    this.applyRadius(this.config.radius);
    this.applyDensity(this.config.density);
    this.applyBorderWidth(this.config.borderWidth);
    this.notify();
  }

  /**
   * Subscribe to config changes (fired after every setter / `loadConfig`
   * call). Returns an unsubscribe function.
   */
  subscribe(listener: ThemeChangeListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const snapshot = this.getConfig();
    this.listeners.forEach((listener) => listener(snapshot));
  }

  private applyColorScheme(colorScheme: ColorScheme): void {
    if (colorScheme === 'system') {
      this.root.removeAttribute('data-theme');
    } else {
      this.root.setAttribute('data-theme', colorScheme);
    }
  }

  /**
   * Writes the multiplier `--stella-radius-panel` (and every component's
   * `border-radius`, which all read that one token) is defined in terms
   * of — `--stella-radius-panel: calc(16px * var(--stella-radius-scale))`
   * — one property write, every component's radius updates with zero
   * re-renders.
   */
  private applyRadius(radius: RadiusStyle): void {
    this.root.style.setProperty('--stella-radius-scale', RADIUS_SCALE[radius]);
  }

  /** Same mechanism as applyRadius, for --stella-space-scale. */
  private applyDensity(density: Density): void {
    this.root.style.setProperty('--stella-space-scale', DENSITY_SCALE[density]);
  }

  /**
   * Writes --stella-border-width directly (no scale multiplier — see
   * BorderWidthStyle's docblock). Every hairline in Terra (Island,
   * Button, Badge, Checkbox, Radio, Switch, Divider, ...) reads this
   * one token, so this one write re-thicknesses all of them.
   */
  private applyBorderWidth(borderWidth: BorderWidthStyle): void {
    this.root.style.setProperty(
      '--stella-border-width',
      BORDER_WIDTH[borderWidth]
    );
  }
}
