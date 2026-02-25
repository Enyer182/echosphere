# Echosphere — Interactive Generative Audio-Visual Experience

An interactive 3D generative audio-visual experience built with React Three Fiber and Tone.js. Explore a luminous procedural terrain and awaken sound layers by touching orbiting planets.

## Features

- **Procedural terrain** — Animated low-poly landscape generated with simplex noise (FBM) with gradient colors from deep ocean to luminous peaks
- **5 synthesized audio layers** — Sub Current, Resonance, Pulse Sequence, Atmosphere, Shimmer — generated in real-time with Tone.js (no audio files needed)
- **Interactive planet nodes** — Click orbiting planets in the 3D scene or use the HUD pill buttons to toggle audio layers on/off
- **Free high-quality planet models** — NASA public-domain GLB models bundled locally (Earth, Mars, Jupiter, Neptune, Mercury)
- **Visual feedback** — Active nodes glow brighter, gain wireframe halos, and emit colored light that reflects on the terrain
- **Atmospheric particles** — Rising dust motes and sparkle fields add depth
- **Starfield sky** — 4000+ stars slowly rotating overhead
- **Orbit camera** — Smooth auto-rotating camera with drag-to-explore controls
- **Local-first assets** — No runtime remote asset fetching; planet models are shipped with the app

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 |
| 3D Engine | Three.js 0.182, @react-three/fiber 9, @react-three/drei 10 |
| Audio | Tone.js (synths, transport sequencing, modulation, immersive FX buses) |
| Build | Vite 7, TypeScript 5.9 |
| Lint | ESLint 9, typescript-eslint |

## Run

```bash
npm install
npm run dev
```

Open the printed local URL (default `http://localhost:5173/`).

## Build

```bash
npm run build
npm run preview
```

## Controls

- **Begin** — Click to start (required for Web Audio API)
- **Planets** — Click orbiting planets in the scene to toggle their audio layer
- **HUD pills** — Click layer names at the top to toggle layers
- **Camera** — Drag to orbit, scroll to zoom

## Architecture

```
src/
├── App.tsx                    # Root: Canvas, overlay UI, HUD
├── components/
│   ├── DreamScene.tsx         # Scene composition (lights, fog, camera)
│   ├── Terrain.tsx            # Procedural FBM terrain mesh
│   ├── FloatingCrystals.tsx   # Interactive orbiting planet nodes
│   ├── ParticleField.tsx      # Dust + sparkle particles
│   └── Sky.tsx                # Starfield
├── hooks/
│   ├── useAudioEngine.ts      # Audio state management
│   └── useColorPalette.ts     # Color scheme
└── utils/
    ├── audio.ts               # Tone.js layer factories + immersive routing
    └── noise.ts               # Simplex noise + FBM
```

## 3D Asset Sources

- Earth model: NASA Solar System Exploration (Public Domain)
- Mars model: NASA Solar System Exploration (Public Domain)
- Jupiter model: NASA Solar System Exploration (Public Domain)
- Neptune model: NASA Solar System Exploration (Public Domain)
- Mercury model: NASA Solar System Exploration (Public Domain)

## License

MIT
