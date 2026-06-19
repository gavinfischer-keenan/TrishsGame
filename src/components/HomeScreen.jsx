/**
 * HomeScreen.jsx
 * The top-level "Trish's Games" landing page.
 * Shows game tiles as large clickable cards.
 *
 * Props:
 *   onSelectGame - (gameKey: string) => void
 */

const GAMES = [
  {
    key: 'bricksmack',
    title: 'BrickSmack',
    subtitle: 'Stack, clear, and score',
    description: 'Drop colorful blocks onto the grid. Clear full rows and columns to score big. Three modes of brick-busting fun.',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    icon: '🧱',
    available: true,
  },
  {
    key: 'buildmeariver',
    title: 'Build Me a River',
    subtitle: 'Route the flow',
    description: 'Connect the source to the sea. Place river tiles to build a flowing path past rocks, houses, and trees.',
    gradient: 'linear-gradient(135deg, #1d4ed8 0%, #06b6d4 100%)',
    icon: '🌊',
    available: true,
  },
  // Future games — kept as coming soon
  {
    key: 'future1',
    title: 'Coming Soon',
    subtitle: 'A new adventure',
    description: 'The next game in Trish\'s Games is being built. Stay tuned!',
    gradient: 'linear-gradient(135deg, #374151 0%, #1f2937 100%)',
    icon: '🔮',
    available: false,
  },
];

const HomeScreen = ({ onSelectGame }) => {
  return (
    <div className="home-container">
      <header className="home-header">
        <h1 className="home-title">
          Trish&apos;s<span className="home-title-accent"> Games</span>
        </h1>
        <p className="home-subtitle">Pick a game and play!</p>
      </header>

      <div className="home-game-grid">
        {GAMES.map(game => (
          <button
            key={game.key}
            className={`game-card ${!game.available ? 'game-card-coming-soon' : ''}`}
            style={{ '--card-gradient': game.gradient }}
            onClick={() => game.available && onSelectGame(game.key)}
            disabled={!game.available}
          >
            <div className="game-card-icon">{game.icon}</div>
            <div className="game-card-body">
              <h2 className="game-card-title">{game.title}</h2>
              <p className="game-card-subtitle">{game.subtitle}</p>
              <p className="game-card-desc">{game.description}</p>
            </div>
            {!game.available && (
              <div className="game-card-lock">
                <span>🔒</span>
                <span>Coming Soon</span>
              </div>
            )}
            <div className="game-card-play-hint">
              {game.available ? 'Click to Play →' : ''}
            </div>
          </button>
        ))}
      </div>

      <footer className="home-footer">
        <p>More games coming soon ✨</p>
      </footer>
    </div>
  );
};

export default HomeScreen;
