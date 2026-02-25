# AGENTS.md

## Cursor Cloud specific instructions

### Overview

Single-service client-side SPA: an interactive generative audio-visual experience called "Echosphere," built with React 19, Three.js (@react-three/fiber), Vite 7, and Web Audio API. No backend, no database, no Docker, no external assets.

### Commands

Standard commands in `package.json`:

- **Dev server**: `npm run dev` (Vite, default port 5173; use `-- --host 0.0.0.0 --port 5176` for remote access)
- **Lint**: `npm run lint` (ESLint 9 with TypeScript)
- **Build**: `npm run build` (runs `tsc -b` then `vite build`)

### Caveats

- The Vite build produces a single large chunk (>500 kB) due to Three.js; this warning is expected.
- Audio only starts after user interaction (browser autoplay policy). The "Begin" overlay handles this.
- No automated test suite; validation is manual (open app, click Begin, toggle nodes, verify audio plays and visuals respond).
- The `react-hooks/purity` ESLint rule is strict about `Math.random()` in render. Use seeded PRNG or module-level initialization for any randomized geometry data.
- Terrain animation runs on every frame via `useFrame`; on low-end GPUs reduce `SEGMENTS` in `Terrain.tsx`.
