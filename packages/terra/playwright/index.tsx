// Playwright CT mount entry — global CSS every component depends on
// (design tokens, state layers) has to load once here, same as
// terra-test's main.tsx does for the dev showcase.
import '../src/styles/tokens.css';
