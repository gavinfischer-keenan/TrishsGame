import { GAMES_CATALOG, getFeaturedGameKey } from '../gameCatalog';

/**
 * HomeScreen.jsx
 * Top-level catalog for Trish's Games displaying all six marine-themed arcade games,
 * featured daily pick, quick launcher actions, and live local personal-best badges.
 */
const HomeScreen = ({ stats = {}, recentGames = [], onSelectGame, onSurpriseMe, onOpenPalette }) => {
  const featuredKey = getFeaturedGameKey();
  const latestKey = recentGames[0]?.key || null;

  return (
    <div className="home-container">
      <header className="home-header">
        <h1 className="home-title">
          Trish&apos;s<span className="home-title-accent"> Games</span>
        </h1>
        <p className="home-subtitle">Pick a marine arcade game — runs 100% locally in your browser.</p>

        <div className="home-quick-actions">
          <button type="button" className="home-action-pill home-action-primary" onClick={onSurpriseMe}>
            🎲 Surprise Me
          </button>
          <button type="button" className="home-action-pill" onClick={onOpenPalette}>
            🔍 Quick Search <kbd>Ctrl+K</kbd>
          </button>
        </div>
      </header>

      <div className="home-game-grid">
        {GAMES_CATALOG.map((game) => {
          const s = stats[game.key];
          const isFeatured = game.key === featuredKey;
          const isRecent = game.key === latestKey;

          let statBadge = '✨ Ready to Play';
          if (s && s.played > 0) {
            if (s.bestScore !== null && s.bestScore !== undefined) {
              statBadge =
                game.key === 'wordwager'
                  ? `🏆 Best: $${s.bestScore}`
                  : `🏆 Best: ${s.bestScore.toLocaleString()} pts`;
            } else if (s.wins > 0) {
              statBadge = `🏆 ${s.wins} ${s.wins === 1 ? 'win' : 'wins'}`;
            } else {
              statBadge = `🎮 ${s.played} ${s.played === 1 ? 'round' : 'rounds'}`;
            }
          }

          return (
            <button
              key={game.key}
              type="button"
              className={`game-card ${isFeatured ? 'game-card-featured' : ''}`}
              style={{ '--card-gradient': game.gradient }}
              onClick={() => onSelectGame(game.key)}
            >
              <div className="game-card-top-row">
                <img className="game-card-logo" src={game.logo} alt={`${game.animal} emblem`} />
                <div className="game-card-badges">
                  {isFeatured && <span className="game-badge game-badge-featured">🌟 Featured</span>}
                  {isRecent && !isFeatured && <span className="game-badge game-badge-recent">⏱ Recent</span>}
                  <span className="game-badge game-badge-key" title={`Press ${game.shortcut} to launch`}>
                    {game.shortcut}
                  </span>
                </div>
              </div>

              <div className="game-card-body">
                <h2 className="game-card-title">{game.animal}</h2>
                <p className="game-card-product">{game.title}</p>
                <p className="game-card-subtitle">{game.subtitle}</p>
                <p className="game-card-desc">{game.description}</p>
              </div>

              <div className="game-card-footer-row">
                <span className="game-card-stat">{statBadge}</span>
                <span className="game-card-play-hint">Play →</span>
              </div>
            </button>
          );
        })}
      </div>

      <footer className="home-footer">
        <p className="animal-links">
          <a href="/about/clown-triggerfish/">About Clown Triggerfish</a> ·{' '}
          <a href="/about/peacock-mantis-shrimp/">About Peacock Mantis Shrimp</a> ·{' '}
          <a href="/about/alphabet-cone-snail/">About Alphabet Cone Snails</a> ·{' '}
          <a href="/about/pistol-shrimp/">About Pistol Shrimp</a> ·{' '}
          <a href="/about/mudskipper/">About Mudskippers</a> ·{' '}
          <a href="/about/archerfish/">About Archerfish</a>
        </p>
        <p>Games run on your device. Word Wager uses play money only; no purchases or payouts.</p>
        <p>
          <a href="https://tripofisch.com/#games-layer">← TripoFisch Games</a> ·{' '}
          <a href="https://github.com/gavinfischer-keenan/TrishsGame">Source code on GitHub ↗</a>
        </p>
      </footer>
    </div>
  );
};

export default HomeScreen;
