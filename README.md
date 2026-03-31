# 💧 GWaterSort – Water Color Sort Puzzle

[![CI](https://github.com/isianust/GWaterSort/actions/workflows/ci.yml/badge.svg)](https://github.com/isianust/GWaterSort/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?logo=vite)](https://vitejs.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

A browser-based **Water Color Sort** puzzle game built with **TypeScript** and **Vite**. Sort colored water segments into tubes so each tube contains only one color.

## 🎮 How to Play

1. **Click** a tube to select it (it rises up).
2. **Click** another tube to pour — the top matching-color segments move to the destination.
3. **Goal:** Sort the water so every tube contains only one color.

### Rules

- You can only pour into a tube that is **empty** or whose top color **matches** the color being poured.
- A tube can hold at most **4** segments.
- Use **Undo** to take back a move, or **Restart Level** to start over.

## ✨ Features

- **100 progressively harder levels** (2 → 20 colors)
- **6 difficulty tiers:** Easy → Normal → Hard → Expert → Master
- **Star rating system** (★ to ★★★★★)
- **Undo & restart** support
- **Move counter** tracking
- **Win detection** with next-level prompt
- **Pour animation** with multi-phase visual effects
- **Responsive design** for mobile and desktop
- **Seeded level generation** — same level always produces the same puzzle
- **Progress persistence** via localStorage
- **Zero runtime dependencies** — pure TypeScript

## 🛠️ Tech Stack

| Category       | Technology                          |
| -------------- | ----------------------------------- |
| Language        | TypeScript 6.0                      |
| Build Tool      | Vite 8.0                            |
| Testing         | Vitest 4.x                          |
| Linting         | ESLint + Prettier                   |
| CI/CD           | GitHub Actions                      |
| Deployment      | GitHub Pages                        |

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- npm >= 9

### Development

```bash
# Install dependencies
npm install

# Start dev server with hot reload
npm run dev

# Type-check
npm run typecheck

# Lint
npm run lint

# Format code
npm run format
```

### Build & Preview

```bash
# Production build (type-check + bundle)
npm run build

# Preview production build locally
npm run preview
```

### Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# With coverage report
npm run test:coverage
```

## 📁 Project Structure

```
GWaterSort/
├── src/
│   ├── core/                   # Game engine (framework-agnostic)
│   │   ├── types.ts            # Type definitions & constants
│   │   ├── color.ts            # HSL color generation (seeded PRNG)
│   │   ├── difficulty.ts       # Difficulty scaling & star ratings
│   │   ├── engine.ts           # Pour logic, win detection, utilities
│   │   ├── level-generator.ts  # Procedural level generation
│   │   └── storage.ts          # localStorage progress persistence
│   ├── ui/
│   │   ├── animations.ts       # Pour animation (3-phase drop)
│   │   └── renderer.ts         # DOM rendering & UI management
│   ├── main.ts                 # Application entry point
│   ├── style.css               # Styles & animations
│   └── index.html              # HTML template
├── tests/                      # Unit & integration tests
├── .github/workflows/          # CI/CD pipelines
├── vite.config.ts              # Vite configuration
├── vitest.config.ts            # Vitest configuration
├── tsconfig.json               # TypeScript configuration
├── eslint.config.js            # ESLint configuration
├── .prettierrc                 # Prettier configuration
└── package.json                # Project metadata & scripts
```

## 🏗️ Architecture

```
┌──────────────────────────────────────────────┐
│                  main.ts                     │
│           (Application Controller)           │
├──────────────┬───────────────────────────────┤
│   UI Layer   │        Core Layer             │
├──────────────┤───────────────────────────────┤
│ renderer.ts  │  engine.ts    │ difficulty.ts │
│ animations.ts│  level-gen.ts │ color.ts      │
│              │  storage.ts   │ types.ts      │
└──────────────┴───────────────┴───────────────┘
```

The **core layer** is fully framework-agnostic and can be tested without a DOM. The **UI layer** handles all browser-specific rendering and animations.

## 🎯 Difficulty System

| Stars | Label  | Levels   | Colors  |
| ----- | ------ | -------- | ------- |
| ★     | Easy   | 1–10     | 2–3     |
| ★★    | Normal | 11–25    | 3–5     |
| ★★★   | Hard   | 26–50    | 5–8     |
| ★★★★  | Expert | 51–80    | 8–12    |
| ★★★★★ | Master | 81–100   | 12–20   |

## 📜 License

This project is licensed under the [MIT License](LICENSE).

