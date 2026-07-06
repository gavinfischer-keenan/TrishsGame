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
  {
    key: 'slippedmymind',
    title: "Slipped My Mind",
    subtitle: 'Crack the secret code',
    description: "Can you deduce the computer's 5-ball colour code in 15 guesses? After every attempt you'll learn what's right — and what's close.",
    gradient: 'linear-gradient(135deg, #6d28d9 0%, #a21caf 100%)',
    icon: '🎯',
    available: true,
  },
  {
    key: 'numberdrawing',
    title: 'Number Drawing',
    subtitle: 'Reconstruct ASCII masterpieces',
    description: 'Use the row and column sums alongside visual blob guides to deduce the hidden numbers and reveal the ASCII art.',
    gradient: 'linear-gradient(135deg, #047857 0%, #064e3b 100%)',
    icon: '🔢',
    available: true,
    underConstruction: true,
  },
  {
    key: 'battleship',
    title: 'Battleship',
    subtitle: 'Sink the enemy fleet',
    description: 'Place your fleet and take turns firing at the enemy. Find and sink all 5 enemy ships before they sink yours.',
    gradient: 'linear-gradient(135deg, #0f4c75 0%, #1b6ca8 100%)',
    icon: '🚢',
    available: true,
  },
  {
    key: 'wordwager',
    title: 'Word Wager',
    subtitle: 'Bet your way to glory',
    description: 'A definition is shown — guess the hidden word letter by letter. Wager money on each guess: correct earns, wrong costs double. Guess the whole word all-in to double your money!',
    gradient: 'linear-gradient(135deg, #92400e 0%, #d97706 60%, #fbbf24 100%)',
    icon: '💰',
    available: true,
  },
  {
    key: 'connect4',
    title: 'Connect 4',
    subtitle: 'Drop, connect, conquer',
    description: 'Drop discs into the grid and be the first to connect four in a row — horizontally, vertically, or diagonally. Play against a sharp AI opponent.',
    gradient: 'linear-gradient(135deg, #be123c 0%, #e11d48 50%, #fb7185 100%)',
    icon: '🔴',
    available: true,
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
            {game.underConstruction && (
              <div className="game-card-construction">
                🚧 Under Construction 🚧
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
