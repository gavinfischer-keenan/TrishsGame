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
    animal: 'Pistol Shrimp', logo: '/brand/pistol-shrimp-logo.jpg',
    title: 'BrickSmack',
    subtitle: 'Stack, clear, and score',
    description: 'Drop colorful blocks onto the grid. Clear full rows and columns to score big. Three modes of brick-busting fun.',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    icon: '🧱',
    available: true,
  },
  {
    key: 'buildmeariver',
    animal: 'Mudskipper', logo: '/brand/mudskipper-logo.jpg',
    title: 'Build Me a River',
    subtitle: 'Route the flow',
    description: 'Connect the source to the sea. Place river tiles to build a flowing path past rocks, houses, and trees.',
    gradient: 'linear-gradient(135deg, #1d4ed8 0%, #06b6d4 100%)',
    icon: '🌊',
    available: true,
  },
  {
    key: 'slippedmymind',
    animal: 'Peacock Mantis Shrimp', logo: '/brand/peacock-mantis-shrimp-logo.jpg',
    title: "Slipped My Mind",
    subtitle: 'Crack the secret code',
    description: "Can you deduce the computer's 5-ball colour code in 15 guesses? After every attempt you'll learn what's right — and what's close.",
    gradient: 'linear-gradient(135deg, #6d28d9 0%, #a21caf 100%)',
    icon: '🎯',
    available: true,
  },
  {
    key: 'archerfish',
    animal: 'Archerfish', logo: '/brand/archerfish-logo.jpg',
    title: 'Fleet Tactics',
    subtitle: 'Sink the enemy fleet',
    description: 'Place your fleet and take turns firing at the enemy. Find and sink all 5 enemy ships before they sink yours.',
    gradient: 'linear-gradient(135deg, #0f4c75 0%, #1b6ca8 100%)',
    icon: '🚢',
    available: true,
  },
  {
    key: 'wordwager',
    animal: 'Alphabet Cone Snail', logo: '/brand/alphabet-cone-snail-logo.jpg',
    title: 'Word Wager',
    subtitle: 'Bet your way to glory',
    description: 'A definition is shown — guess the hidden word letter by letter. Wager play-money points on each guess: correct earns, wrong costs double. Guess the whole word all-in to double your points!',
    gradient: 'linear-gradient(135deg, #92400e 0%, #d97706 60%, #fbbf24 100%)',
    icon: '💰',
    available: true,
  },
  {
    key: 'clowntriggerfish',
    animal: 'Clown Triggerfish', logo: '/brand/clown-triggerfish-logo.jpg',
    title: 'Four in a Row',
    subtitle: 'Drop, connect, conquer',
    description: 'Drop discs into the grid and be the first to line up four discs — horizontally, vertically, or diagonally. Play against a sharp AI opponent.',
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
            {game.logo ? <img className="game-card-logo" src={game.logo} alt="" /> : <div className="game-card-icon">{game.icon}</div>}
            <div className="game-card-body">
              <h2 className="game-card-title">{game.animal || game.title}</h2>
              {game.animal && <p className="game-card-product">{game.title}</p>}
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
        <p className="animal-links"><a href="/about/clown-triggerfish/">About Clown Triggerfish</a> · <a href="/about/peacock-mantis-shrimp/">About Peacock Mantis Shrimp</a> · <a href="/about/alphabet-cone-snail/">About Alphabet Cone Snails</a> · <a href="/about/pistol-shrimp/">About Pistol Shrimp</a> · <a href="/about/mudskipper/">About Mudskippers</a> · <a href="/about/archerfish/">About Archerfish</a></p>
        <p>Games run on your device. Word Wager uses play money only; no purchases or payouts.</p>
        <p><a href="https://tripofisch.com/#games-layer">← TripoFisch Games</a> · <a href="https://github.com/gavinfischer-keenan/TrishsGame">Source code on GitHub ↗</a></p>
      </footer>
    </div>
  );
};

export default HomeScreen;
