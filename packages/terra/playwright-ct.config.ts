import { defineConfig, devices } from '@playwright/experimental-ct-react';

// Component tests for anything whose correctness lives in real CSS —
// :has() escalation, computed background/border colors, focus rings —
// which jsdom (vitest.config.ts) can't evaluate. Runs *.ct.tsx files
// colocated next to the component they cover, same as *.test.tsx.
export default defineConfig({
  testDir: './src',
  testMatch: '**/*.ct.tsx',
  snapshotDir: './__snapshots__',
  timeout: 10_000,
  fullyParallel: true,
  reporter: 'list',
  use: {
    trace: 'on-first-retry',
    ctViteConfig: {},
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
