# Architecture & Repository Structure

Trish's Games is a client-side React 19 + Vite 8 arcade hosting six self-contained games with zero backend dependencies.

## Directory Layout

```text
.
├── .github/workflows/       # CI checks (lint, build, verify-build)
├── docs/                    # Current technical & deployment documentation
│   ├── archive/             # Legacy README and superseded v1 brand logo drafts
│   ├── ARCHITECTURE.md      # Codebase structure and state patterns
│   ├── DEPLOYMENT.md        # Static hosting, PWA, CSP, and verification guide
│   └── UX-AND-RESPONSIVE-AUDIT.md
├── public/                  # Static files copied verbatim to dist/
│   ├── about/               # Natural history pages for all 6 marine species
│   ├── assets/              # Credited species photography
│   ├── brand/               # Active circular emblems for the 6 games
│   ├── manifest.json        # PWA manifest (scope: ./, start_url: ./)
│   └── THIRD-PARTY-NOTICES.txt
├── scripts/
│   ├── build-offline.mjs    # Generates content-hashed dist/sw.js precache manifest
│   └── verify-build.mjs     # Verifies routes, manifest, CSP, and service worker
└── src/
    ├── components/          # Shared shell, modals, catalog, and delight helpers
    ├── games/               # Individual game implementations and local engines
    │   ├── archerfish/      # Fleet Tactics (10x10 setup + hunt/target AI)
    │   ├── bricksmack/      # BrickSmack (8x8/16x16 block puzzle + drag/drop)
    │   ├── buildmeariver/   # Build Me a River (BFS flow + obstacles + levels)
    │   ├── clowntriggerfish/# Four in a Row (minimax + alpha-beta AI)
    │   ├── slippedmymind/   # Slipped My Mind (5-slot code deduction + hints)
    │   └── wordwager/       # Word Wager (American + World Regional English decks)
    ├── utils/
    │   └── storage.js       # LocalStorage persistence + Web Audio synthesizer
    ├── gameCatalog.js       # Single source of truth for the 6 game cards
    ├── gameRoutes.js        # Safe Object.hasOwn hash route resolver
    ├── App.jsx              # Shell, TopNavBar, global shortcuts, modal coordination
    ├── index.css            # Unified dark-mode design system & responsive rules
    └── main.jsx             # React root + production SW registration
```

## Navigation & Hash Routing

`src/gameRoutes.js` maps URL hashes (`#bricksmack`, `#brick`, `#river`, `#buildmeariver`, `#mind`, `#slippedmymind`, `#archerfish`, `#wordwager`, `#word`, `#clowntriggerfish`, `#clown-triggerfish`) safely via `Object.hasOwn(HASH_MAP, key)`.

## Keyboard Shortcuts & Command Palette

- **`Cmd/Ctrl + K`** opens `CommandPalette.jsx` to search recently played games, all 6 games, animal pages, settings, scoreboard, and quick actions.
- **`?`** opens `ShortcutsModal.jsx` listing all 10 keyboard shortcuts.
- All single-key shortcuts (`H`, `1`–`6`, `R`, `S`, `L`, `M`, `G`) check `isEditableTarget(e.target)` so they never fire while typing inside inputs, textareas, or selects. During active Word Wager letter-guessing rounds, `A`–`Z` letter keys map directly to letter guesses.

## Local Persistence

All preferences and history live strictly in browser `localStorage` under:

- `trishs_settings_v1` — Gameplay defaults, sound toggle, reduced motion, high contrast, shortcut preferences.
- `trishs_recent_v1` — Recently launched games (used by Command Palette and catalog cards).
- `trishs_stats_v1` — Per-game play counts, wins, and personal bests (synced with legacy `bricksmack_highscore_*` keys).
