export const LEVELS = [
  {
    id: 'star',
    name: 'Star',
    grid: [
      "      78      ",
      "     778      ",
      "    7787      ",
      "77777788777777",
      "  7777887777  ",
      "   77788777   ",
      "   77788778   ",
      "  777    777  ",
      " 7          7 "
    ]
  },
  {
    id: 'heart',
    name: 'Heart',
    grid: [
      "  020    020  ",
      " 25522  25522 ",
      "2     5      2",
      "2            2",
      "0            0",
      " 0          0 ",
      "  25      22  ",
      "    2    2    ",
      "      2       "
    ]
  },
  {
    id: 'smiley',
    name: 'Smiley',
    grid: [
      "   99009   ",
      " 99     99 ",
      "9  0   0  9",
      "9         9",
      "9  3   3  9",
      "9  3333   9",
      " 99     99 ",
      "   990999  "
    ]
  },
  {
    id: 'spade',
    name: 'Spade',
    grid: [
      "      6      ",
      "     6116    ",
      "     1661    ",
      "    666666   ",
      "   11111111  ",
      "  4444444646 ",
      " 666666666666",
      "      444    ",
      "      444    ",
      "      474    "
    ]
  },
  {
    id: 'rocket',
    name: 'Rocket',
    grid: [
      "    0    ",
      "   000   ",
      "  0 0 0  ",
      "  00300  ",
      "  3 0 3  ",
      "  3 0 3  ",
      "  5   5  ",
      " 5555555 ",
      "353353353",
      "3       3"
    ]
  },
  {
    id: 'cloud',
    name: 'Cloud',
    grid: [
      "     8228     ",
      "   8228    2  ",
      "  8  88  282  ",
      " 288    2   2 ",
      "8            2",
      " 444444444444 "
    ]
  },
  {
    id: 'fish',
    name: 'Fish',
    grid: [
      "    01     ",
      "  00100   2",
      "00     0 2 ",
      "1  111  22 ",
      "00     0 2 ",
      "  00100   2",
      "    11     "
    ]
  },
  {
    id: 'lightning',
    name: 'Lightning',
    grid: [
      "   7777 ",
      "  7   6 ",
      "  7   6 ",
      "  7  9  ",
      "  7  6669",
      " 7669 9 ",
      "   7 6  ",
      "   76   ",
      "   79   ",
      "   9    "
    ]
  },
  {
    id: 'mug',
    name: 'Mug',
    grid: [
      "1441441  ",
      "1      12",
      "1      1 2",
      "1      1 2",
      "1      12",
      "1      1 ",
      " 44444   "
    ]
  },
  {
    id: 'skull',
    name: 'Alien',
    grid: [
      "88        88",
      "88        88",
      "8          8",
      "            ",
      "  000  000  ",
      "33   33   33",
      " 33  3   88 ",
      "   333333   "
    ]
  }
];

export const parseLevelGrid = (gridTextArray) => {
  // Ensure rectangular grid by finding max length
  const maxLen = Math.max(...gridTextArray.map(r => r.length));
  
  return gridTextArray.map(r => {
    const padded = r.padEnd(maxLen, ' ');
    return padded.split('').map(char => {
      if (char === ' ' || char === '.') return { type: 'empty', target: null };
      return { type: 'playable', target: parseInt(char, 10) };
    });
  });
};
