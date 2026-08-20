import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Logic/a11y/keyboard-behavior tests only — jsdom doesn't evaluate real
// CSS (:has(), light-dark()), so anything whose correctness lives in
// the stylesheet (state-layer escalation, focus rings, the separator
// hover bug from this session) is covered by the Playwright component
// tests in playwright-ct.config.ts instead, not here. See WIKI.md's
// Testing section.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
