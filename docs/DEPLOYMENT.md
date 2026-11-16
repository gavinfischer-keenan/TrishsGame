# Trish’s Games Deployment

Public catalog: https://games.11mosswood.us/ · Direct routes: `/#bricksmack`, `/#river`, `/#mind`, `/#archerfish`, `/#wordwager`, `/#clowntriggerfish`. Homepage displays six separate marine-themed game cards with assigned animal identities and logos.

## Build & Verification Requirements

Use Node 22 or newer:

```bash
npm ci
npm run lint
npm run build
npm test
```

- Only deploy `dist/`.
- Do not publish source directories (`src/`, `docs/`, `scripts/`) or `node_modules/`.
- Preserve `public/THIRD-PARTY-NOTICES.txt`.
- No server runtime, game API, or database is required; audio and computer opponents run locally in the visitor's browser.
- Word Wager uses play money only with no purchases or payouts.

## Offline PWA & Service Worker

`npm run build` runs Vite and `scripts/build-offline.mjs`, generating a content-hashed `dist/sw.js` that:

- Precaches the full static build.
- Handles same-origin scope (`./`) only.
- Uses network-first navigation with offline fallback to cached `index.html`.
- Preserves unrelated caches while cleaning up older `trishs-games-*` caches on activation.

## Hosting & Security Headers (CSP)

Caddy on `NODE01 CT101` serves `/srv/tripofisch/current/arcade-app` for `games.11mosswood.us` through the dedicated Cloudflare Tunnel:

- `/bricksmack` redirects to `/#bricksmack`.
- `manifest.json` is served as `application/manifest+json`.
- HTML, `sw.js`, and static assets revalidate (`Cache-Control: no-cache`).
- CSP permits self-hosted scripts (`script-src 'self'`), inline styles, and `data:`/`blob:` media; no external fonts (`fonts.googleapis.com`) or gameplay network calls.
- Non-GET requests are rejected (`405`), unknown paths return `404`.
- Optional container setup is provided via `Dockerfile`, `docker-compose.yml`, and `nginx.conf`.

## Verification Checks

`npm test` (`scripts/verify-build.mjs`) verifies:

- 16 hash-route cases including valid aliases, `#clown-triggerfish`, prototype keys (`#constructor`, `#__proto__`), and unknown/empty hashes.
- `dist/manifest.json` `start_url` and `scope` (`./`).
- Zero external `fonts.googleapis.com` links or inline `<script>` blocks in `dist/index.html`.
- Valid generated `dist/sw.js` precache manifest.

## Animal Identities & Attributions

- **Pistol Shrimp** — *BrickSmack* (`#bricksmack`)
- **Mudskipper** — *Build Me a River* (`#river`)
- **Peacock Mantis Shrimp** — *Slipped My Mind* (`#mind`)
- **Archerfish** — *Fleet Tactics* (`#archerfish`)
- **Alphabet Cone Snail** — *Word Wager* (`#wordwager`)
- **Clown Triggerfish** — *Four in a Row* (`#clowntriggerfish`)

Animal profile pages in `public/about/` use credited reusable photos and linked scientific sources. Logos were supplied by the site owner; superseded v1 logo drafts are archived in `docs/archive/brand-v1/`. Public source link: https://github.com/gavinfischer-keenan/TrishsGame.
