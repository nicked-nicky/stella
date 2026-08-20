#!/usr/bin/env node
/**
 * Copies every CSS file (*.css / *.module.css) from src/ to dist/ 1:1.
 * tsc only emits .ts/.tsx — this is the one extra step unbundled output
 * needs, kept as ~20 lines of plain Node rather than pulling in an
 * asset-copying dependency for it.
 *
 * @format
 */

import { readdir, mkdir, copyFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const srcDir = join(scriptDir, '..', 'src');
const distDir = join(scriptDir, '..', 'dist');

let count = 0;

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
      await copyFile(from, to);
      count += 1;
    }
  }
}

await copyCss(srcDir);
console.log(`copy-css: ${count} file(s) → dist/`);
