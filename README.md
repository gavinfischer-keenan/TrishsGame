# Trish's Games

Welcome to **Trish's Games** — a premium, modern web-based gaming application hosting a collection of uniquely crafted games. Built with React, Vite, and custom Vanilla CSS.

---

## 🎮 The Games Collection

### 1. BrickSmack
Stack, clear, and score in this premium block puzzle experience. Drop colorful blocks onto the grid, complete rows and columns, and aim for high scores.
* **Play Normal**: The classic block puzzle experience.
* **Color Coordinated**: Clearing lines of the same color awards massive score multipliers.
* **Colorfully Rotate on This**: Adds block rotation (via Spacebar or on-screen buttons) and rewards massive color coordination bonuses.
* **Features**: Multi-size grids (8x8, 16x16), custom smooth drag-and-drop mechanics, predictive snap shadows, and Tetris-style irregular shapes.

### 2. Build Me a River
A strategic puzzle where you route the flow of water from a starting point to an endpoint. 
* **Mechanics**: Place river tiles to build a flowing path. You are given 3 playable tiles to choose from at any given time.
* **Obstacles**: Navigate around impassable Rocks, supply water to Houses and Trees (which automatically redirect your placed tiles), and fill expansive Lakes that act as huge multi-directional water junctions.
* **Level System**: Play through multiple predefined levels scaling from 16x16 up to expansive 64x64 flood plains.

### 3. Slipped My Mind
A modern take on the classic mastermind code-breaking game.
* **Gameplay**: The computer chooses a secret 5-ball code out of 6 possible vibrant colors.
* **Deduction**: You have 15 guesses to crack the code.
* **Feedback**: After each guess, the game tells you how many balls are the right color and in the right place, and how many are the right color but in the wrong place.
* **Hint System**: Use hints at the cost of additional turns to deduce the right placements.

### 4. Number Drawing
A logic puzzle that blends Nonograms with arithmetic to reconstruct ASCII art masterpieces.
* **Mechanics**: You are presented with row and column segment sums, alongside faint visual blob guides.
* **Deduction**: Use the intersection of row/column sums and contiguous blob shapes to deduce the exact hidden numbers across the grid.
* **Level Editor**: Contains a built-in text-based level editor allowing you to paste any ASCII art numeric grid to generate custom puzzles on the fly.

---

## ✨ Application Features

* **Monorepo Architecture**: A centralized home screen that acts as the entry point to all games.
* **Ultra-Premium Aesthetics**: Full glassmorphism design, Outfit font typography, customized dark mode gradients, dynamic selection rings, and fluid micro-animations across all menus and games.
* **Fully Responsive**: Playable on desktop and mobile devices.

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

Compile an optimized production build:
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
