/**
 * Ambient module declaration for CSS Modules imports (`*.module.css`).
 *
 * `terra` deliberately has no Vite/bundler dependency of its own — no
 * build tooling until it's actually needed — so it doesn't get this
 * typing for free from `vite/client` the way `terra-test` does.
 * Declared once here instead of adding a dependency just to satisfy
 * `tsc --noEmit` on this package.
 */
declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}
