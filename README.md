# BrickSmack (Trish's Game)

Welcome to **BrickSmack** (also known as Trish's Game) — a premium, modern puzzle game inspired by block clearing puzzles, crafted with React, Vite, and custom Vanilla CSS.

---

## 🎮 Game Modes

1. **Play Normal**: The classic block puzzle experience. Drag blocks from the tray onto the grid to form complete horizontal rows or vertical columns to clear them and score points.
2. **Color Coordinated**: In this mode, clearing lines of the same color awards massive color-match point multipliers.
3. **Rotate on this**: Introduces shape rotation. 
   - **Keyboard Rotation (Desktop)**: Press the `Spacebar` while dragging a block in mid-air to rotate it 90° clockwise. The mouse remains locked to the exact same relative position.
   - **Tray Button Rotation (Mobile & Desktop)**: Click or tap the circular arrow overlay (↻) on any block in the tray to rotate it in place before dragging.

---

## ✨ Features

* **Multi-Size Grid System**: Choose your board scale directly from the main menu:
  - **8x8** (Standard)
  - **16x16** (Expanded)
  - **32x32** (Expert)
  - **64x64** (Insane)
* **Custom Drag and Drop Hook**: Built entirely using pointer events, bypassing standard HTML5 drag-and-drop issues. 
* **Precision Hover & Snap Shadows**: Shows exactly where the block will land before releasing, colored dynamically according to placement validity (valid vs. invalid placement colors).
* **Obstruct-Free Dragging**: The picked-up piece is shifted vertically above your pointer and rendered at `0.6` opacity, leaving your view of the board completely clear.
* **Proportional Scaling**: Blocks in the tray are rendered smaller to fit neatly. When picked up, they scale up instantly to match the exact size of the board cells, maintaining pixel-perfect snapping relative to your mouse coordinate.
* **Tetris-Style Irregular Shapes**: Includes complex L-shapes, T-shapes, Z-shapes, and Crosses alongside standard rectangles.
* **Weighted Distribution**: Simple shapes appear more frequently, while complex irregular shapes have a lower probability, balancing difficulty.
* **Ultra-Premium Aesthetics**: Full glassmorphism design, Outfit font typography, customized dark mode gradients, and micro-animated buttons.

---

## 🛠️ Tech Stack

* **Frontend**: React 19, Vanilla CSS
* **Build System**: Vite 8
* **Code Quality**: ESLint 10

---

## 🚀 Getting Started

### Prerequisites

* Node.js (version 18 or higher recommended)
* npm (comes bundled with Node.js)

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the local development server:
   ```bash
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:5173`.

### Building for Production

Compile a optimized production build:
```bash
npm run build
```

Preview the production build locally:
```bash
npm run preview
```

---

## ⚖️ License

Private repository. All rights reserved.
