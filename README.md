# Trish's Games — Public Browser Arcade

Live catalog: https://games.11mosswood.us/ (also featured on [tripofisch.com](https://tripofisch.com/#games-layer)).  
Six self-contained marine-themed games computed 100% locally in your browser — no backend, accounts, ads, or gameplay network requests. Word Wager uses play money only with no purchases or payouts.

---

## 🎮 The Six Games

| # | Game | Marine Identity | Direct Hash | Description |
|---|------|-----------------|-------------|-------------|
| **1** | **BrickSmack** | Pistol Shrimp | `#bricksmack` | Drop blocks onto `8×8` or `16×16` grids to clear rows and columns across Normal, Color Coordinated, and Rotation modes. |
| **2** | **Build Me a River** | Mudskipper | `#river` | Route flowing water from spring to sea around rocks, farmhouses, trees, and lakes across 4 levels and 3 map scales (`16×16` to `64×64`). |
| **3** | **Slipped My Mind** | Peacock Mantis Shrimp | `#mind` | Crack the hidden 5-ball color code within 15 turns using exact and close feedback pegs plus tactical hints. |
| **4** | **Fleet Tactics** | Archerfish | `#archerfish` | Deploy your 5-ship fleet (drag, drop, Spacebar rotate) and sink the enemy armada before yours is sunk. |
| **5** | **Word Wager** | Alphabet Cone Snail | `#wordwager` | Uncover hidden words from definition clues using **American English** or **World & Regional English** decks, play-money wagers, and All-In sprints. |
| **6** | **Four in a Row** | Clown Triggerfish | `#clowntriggerfish` | Drop discs against an alpha-beta minimax AI opponent and connect four first. |

---

## ✨ Key Features

- **Command Palette (`Ctrl/Cmd + K`)**: Instant search across games, recent items, animal profiles, scoreboard stats, settings, and quick actions.
- **Keyboard Shortcuts (`?`)**: 10 fast navigation & gameplay shortcuts with automatic protection while typing in inputs.
- **Unified Settings & Scoreboard**: Grouped gameplay defaults, synthesized Web Audio effects, Reduced Motion, High-Contrast boards, and local personal-best tracking.
- **Offline-Ready PWA**: Content-hashed service worker generated at build time (`scripts/build-offline.mjs`) with zero external font or API dependencies.
- **Responsive Across Viewports**: Tested and verified with zero horizontal overflow at `360px`, `768px`, `1024px`, and `1440px`.

---

## 🛠️ Tech Stack & Commands

- **Frontend**: React 19, Vanilla CSS, Web Audio API
- **Build & Tooling**: Vite 8, ESLint 10, Node 22+

```bash
npm ci           # Install dependencies
npm run dev      # Start local dev server (http://localhost:5173)
npm run lint     # Run ESLint across src/ and scripts/
npm run build    # Build dist/ and generate dist/sw.js
npm test         # Run route, manifest, CSP, and SW verification (scripts/verify-build.mjs)
npm run preview  # Preview production dist/ locally
```

---

## 📚 Documentation

- [**Architecture & Repository Layout**](docs/ARCHITECTURE.md) — Directory structure, hash routing, storage keys, and shortcut rules.
- [**Deployment & Hosting Guide**](docs/DEPLOYMENT.md) — Static `dist/` deployment, PWA service worker behavior, CSP headers, and Docker notes.
- [**UX & Responsive Audit**](docs/UX-AND-RESPONSIVE-AUDIT.md) — Details on Word Wager cleanup, responsive fixes, empty states, and settings.
- [**Archive**](docs/archive/README-legacy.md) — Superseded documentation and archived v1 brand drafts (`docs/archive/brand-v1/`).
