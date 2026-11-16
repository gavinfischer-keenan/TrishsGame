/**
 * Single source of truth for all six games in Trish's Games.
 * Shared across HomeScreen, CommandPalette, StatsModal, and ShortcutsModal.
 */
export const GAMES_CATALOG = [
  {
    key: 'bricksmack',
    shortcut: '1',
    animal: 'Pistol Shrimp',
    logo: '/brand/pistol-shrimp-logo-v2.jpg',
    title: 'BrickSmack',
    subtitle: 'Stack, clear, and score',
    description:
      'Drop colorful blocks onto the grid. Clear full rows and columns to score big across three modes.',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    icon: '🧱',
    aboutUrl: '/about/pistol-shrimp/',
    available: true,
    scoreUnit: 'pts',
  },
  {
    key: 'buildmeariver',
    shortcut: '2',
    animal: 'Mudskipper',
    logo: '/brand/mudskipper-logo-v2.jpg',
    title: 'Build Me a River',
    subtitle: 'Route the flow',
    description:
      'Connect the source to the sea. Place river tiles to build a flowing path past rocks, houses, and trees.',
    gradient: 'linear-gradient(135deg, #1d4ed8 0%, #06b6d4 100%)',
    icon: '🌊',
    aboutUrl: '/about/mudskipper/',
    available: true,
    scoreUnit: 'wins',
  },
  {
    key: 'slippedmymind',
    shortcut: '3',
    animal: 'Peacock Mantis Shrimp',
    logo: '/brand/peacock-mantis-shrimp-logo.jpg',
    title: 'Slipped My Mind',
    subtitle: 'Crack the secret code',
    description:
      "Deduce the computer's 5-ball color code in 15 guesses using exact and close feedback pegs.",
    gradient: 'linear-gradient(135deg, #6d28d9 0%, #a21caf 100%)',
    icon: '🎯',
    aboutUrl: '/about/peacock-mantis-shrimp/',
    available: true,
    scoreUnit: 'wins',
  },
  {
    key: 'archerfish',
    shortcut: '4',
    animal: 'Archerfish',
    logo: '/brand/archerfish-logo.jpg',
    title: 'Fleet Tactics',
    subtitle: 'Sink the enemy fleet',
    description:
      'Deploy your ships and take turns firing salvos to sink all 5 enemy vessels before yours go down.',
    gradient: 'linear-gradient(135deg, #0f4c75 0%, #1b6ca8 100%)',
    icon: '🚢',
    aboutUrl: '/about/archerfish/',
    available: true,
    scoreUnit: 'wins',
  },
  {
    key: 'wordwager',
    shortcut: '5',
    animal: 'Alphabet Cone Snail',
    logo: '/brand/alphabet-cone-snail-logo-v2.jpg',
    title: 'Word Wager',
    subtitle: 'Wager & solve words',
    description:
      'Read the definition and uncover the hidden word letter by letter using play-money wagers or an all-in sprint.',
    gradient: 'linear-gradient(135deg, #92400e 0%, #d97706 60%, #fbbf24 100%)',
    icon: '💰',
    aboutUrl: '/about/alphabet-cone-snail/',
    available: true,
    scoreUnit: '$',
  },
  {
    key: 'clowntriggerfish',
    shortcut: '6',
    animal: 'Clown Triggerfish',
    logo: '/brand/clown-triggerfish-logo.jpg',
    title: 'Four in a Row',
    subtitle: 'Drop, connect, conquer',
    description:
      'Drop discs into the grid and be the first to connect four horizontally, vertically, or diagonally.',
    gradient: 'linear-gradient(135deg, #be123c 0%, #e11d48 50%, #fb7185 100%)',
    icon: '🔴',
    aboutUrl: '/about/clown-triggerfish/',
    available: true,
    scoreUnit: 'wins',
  },
];

export const GAME_BY_KEY = Object.fromEntries(GAMES_CATALOG.map((g) => [g.key, g]));

/** Deterministic daily featured game based on local calendar date */
export function getFeaturedGameKey(date = new Date()) {
  const daySeed = date.getFullYear() * 372 + (date.getMonth() + 1) * 31 + date.getDate();
  return GAMES_CATALOG[daySeed % GAMES_CATALOG.length].key;
}
