# Trish’s Games deployment

Public catalog: https://games.11mosswood.us/ . Direct games: /#bricksmack, /#river, /#mind, /#archerfish, /#wordwager, /#clowntriggerfish. Homepage has six separate cards. Names and logos are placeholders until provided.

Use Node 22 or newer: `npm ci`, `npm run build`, `npm test`. Only deploy dist/. No server runtime, game API or database. Audio and computer opponents run locally. Word Wager uses play money only with no purchases or payouts.

The build generates a versioned service worker that precaches the full static build, handles same-origin scope only, uses network-first navigation and preserves unrelated caches. Old app windows must close before an update activates. The installed PWA starts at the catalog. First online load must complete before offline use. Installation depends on browser/device support.

Caddy on NODE01 CT101 serves /srv/tripofisch/current/arcade-app for games.11mosswood.us through the dedicated public Cloudflare Tunnel. /bricksmack redirects to /#bricksmack. Manifest is application/manifest+json; HTML, SW and assets revalidate. CSP permits self-hosted scripts, inline styles and data/blob media; no external fonts or gameplay network calls. POST rejected 405, unknown paths 404. No TTO service changed.

Checks: 15 hash-route cases including invalid/prototype names, manifest scope/catalog entry and generated offline cache. Browser checks cover all six launch screens, starting BrickSmack, and a Four in a Row human/computer turn. Dependency audit after compatible updates reported no vulnerabilities.

The provided Dockerfile is optional and serves the same static build. Server.py is a local preview helper and is not deployed. Do not publish source directories or node_modules. Preserve THIRD-PARTY-NOTICES.txt. Public source link: https://github.com/gavinfischer-keenan/TrishsGame.

Current names: Archerfish / Fleet Tactics (#archerfish); Pistol Shrimp / BrickSmack; Mudskipper / Build Me a River; Alphabet Cone Snail / Word Wager; Peacock Mantis Shrimp / Slipped My Mind. Animal pages in public/about use credited reusable photos and linked scientific sources. Logos supplied by site owner. Animal HTML/CSS is generated in the TripoFisch site project then retained in public/ for standalone app builds. Current old naval title removed from source, UI and shortcut; Git history and protected rollback copies are retained. This branding change is not a legal clearance opinion.
