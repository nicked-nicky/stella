#!/usr/bin/env node
/**
 * Copies every CSS file (*.css / *.module.css) from src/ to dist/,
 * stripping comments along the way. tsc only emits .ts/.tsx — this is
 * the one extra step unbundled output needs, kept as plain Node rather
 * than pulling in an asset-copying/minifying dependency for it.
 *
 * Comment stripping mirrors tsc's own `removeComments` (see
 * tsconfig.json): src/ keeps every design-rationale comment in full —
 * they're the reason this codebase is maintainable — dist/ just
 * doesn't ship them as bytes. tokens.css alone is ~59% comments by
 * measured weight, so this isn't a rounding error.
 *
 * @format
 */

import { readdir, mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const srcDir = join(scriptDir, '..', 'src');
const distDir = join(scriptDir, '..', 'dist');

let count = 0;

/**
 * Strips /* ... *\/ block comments (CSS has no line-comment syntax) and
 * collapses the blank lines they leave behind. A plain regex is safe
 * here specifically because this is authored design-token/component
 * CSS, not arbitrary user content — nothing in this codebase puts a
 * literal `/*`/`*\/` inside a string or url() value.
 */
function stripComments(css) {
  return (
    css
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^[ \t]+$/gm, '') // whitespace-only lines a removed comment left behind
      .replace(/\n{2,}/g, '\n') // collapse the resulting blank-line runs
      .trim() + '\n'
  );
}

async function copyCss(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const from = join(dir, entry.name);
    if (entry.isDirectory()) {
      await copyCss(from);
    } else if (entry.name.endsWith('.css')) {
      const rel = from.slice(srcDir.length + 1);
      const to = join(distDir, rel);
      await mkdir(dirname(to), { recursive: true });
      const css = await readFile(from, 'utf8');
      await writeFile(to, stripComments(css));
      count += 1;
    }
  }
}

await copyCss(srcDir);
console.log(`copy-css: ${count} file(s) → dist/ (comments stripped)`);
