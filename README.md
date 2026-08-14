# Stella

A React-first, Tauri-optimized UI kit, GTK 4 / libadwaita-inspired.

- **`@stella/terra`** — the base. Thin, optimized, functional. Foundation for fast, native-feeling desktop apps.
- **`@stella/vidrio`** — the expansion. A superset of Terra adding aesthetic richness: frosted glass, dynamic lighting, textures, dynamic borders. Never required to use Terra.

Terra never depends on Vidrio. Vidrio depends on Terra.

## Status

Early scaffold. See [`docs/open-questions.md`](./docs/open-questions.md) for architectural decisions still to be made before real component code is written, and [`INSTRUCTIONS.md`](./INSTRUCTIONS.md) for how this project should be approached.

## Structure

```
packages/
  terra/    @stella/terra  — base package
  vidrio/   @stella/vidrio — depends on @stella/terra via workspace:*
```

Each package follows atomic design: `src/atoms/`, `src/molecules/`, `src/organisms/`, `src/layout/`.

## Requirements

- Node >= 20
- pnpm (workspaces)

## Getting started

```bash
pnpm install
```

Build/dev/test scripts are wired at the workspace root but guarded (`--if-present`) since build tooling for the packages hasn't been chosen yet.
