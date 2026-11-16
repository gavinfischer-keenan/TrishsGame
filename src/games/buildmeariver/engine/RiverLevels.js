/**
 * RiverLevels.js
 * Level definitions for Build Me a River.
 * All positions are defined for the base 16×16 grid and scaled proportionally.
 */

export const SIZE_MAP = {
  stream: 16,
  river: 32,
  flood: 64,
};

export const SIZE_LABELS = [
  { key: 'stream', label: 'Stream', subtitle: '16×16' },
  { key: 'river', label: 'River', subtitle: '32×32' },
  { key: 'flood', label: 'Flood', subtitle: '64×64' },
];

export function scaleObstacles(obstacles, targetSize) {
  const scale = targetSize / 16;
  return obstacles.map((obs) => ({
    ...obs,
    cells: obs.cells.map(({ r, c }) => ({
      r: Math.round(r * scale),
      c: Math.round(c * scale),
    })),
  }));
}

export function scaleEdgePos(pos, targetSize) {
  return Math.round(pos * (targetSize / 16));
}

export const EDGE_INWARD = { N: 'S', S: 'N', E: 'W', W: 'E' };

export const LEVELS = [
  {
    id: 1,
    label: 'Tutorial',
    badge: 'Level 1',
    description: 'Find a path through the woods and past the old farmhouse.',
    start: { edge: 'W', pos: 7 },
    end: { edge: 'E', pos: 7 },
    obstacles: [
      { type: 'ROCK', cells: [{ r: 7, c: 8 }] },
      { type: 'ROCK', cells: [{ r: 5, c: 5 }] },
      {
        type: 'HOUSE',
        groupId: 1,
        cells: [
          { r: 3, c: 7 }, { r: 3, c: 8 },
          { r: 4, c: 7 }, { r: 4, c: 8 },
        ],
      },
      { type: 'TREES', treeId: 1, cells: [{ r: 10, c: 4 }] },
      { type: 'TREES', treeId: 2, cells: [{ r: 10, c: 5 }] },
      { type: 'TREES', treeId: 3, cells: [{ r: 11, c: 4 }] },
      {
        type: 'LAKE',
        groupId: 1,
        cells: [
          { r: 12, c: 9 }, { r: 12, c: 10 }, { r: 13, c: 9 },
        ],
      },
    ],
  },
  {
    id: 2,
    label: 'Twin Bridges',
    badge: 'Level 2',
    description: 'Cross the rocky central ridge from north to south via flanking farmhouses.',
    start: { edge: 'N', pos: 7 },
    end: { edge: 'S', pos: 7 },
    obstacles: [
      { type: 'ROCK', cells: [{ r: 7, c: 6 }] },
      { type: 'ROCK', cells: [{ r: 7, c: 7 }] },
      { type: 'ROCK', cells: [{ r: 7, c: 8 }] },
      { type: 'ROCK', cells: [{ r: 7, c: 9 }] },
      {
        type: 'HOUSE',
        groupId: 1,
        cells: [
          { r: 4, c: 3 }, { r: 4, c: 4 },
          { r: 5, c: 3 }, { r: 5, c: 4 },
        ],
      },
      {
        type: 'HOUSE',
        groupId: 2,
        cells: [
          { r: 9, c: 11 }, { r: 9, c: 12 },
          { r: 10, c: 11 }, { r: 10, c: 12 },
        ],
      },
      { type: 'TREES', treeId: 1, cells: [{ r: 3, c: 11 }] },
      { type: 'TREES', treeId: 2, cells: [{ r: 11, c: 4 }] },
      {
        type: 'LAKE',
        groupId: 1,
        cells: [
          { r: 11, c: 7 }, { r: 11, c: 8 },
        ],
      },
    ],
  },
  {
    id: 3,
    label: 'Highland Lakes',
    badge: 'Level 3',
    description: 'Link twin mountain reservoirs across the valley to reach the eastern coast.',
    start: { edge: 'W', pos: 3 },
    end: { edge: 'E', pos: 12 },
    obstacles: [
      { type: 'ROCK', cells: [{ r: 3, c: 10 }] },
      { type: 'ROCK', cells: [{ r: 8, c: 7 }] },
      { type: 'ROCK', cells: [{ r: 12, c: 4 }] },
      {
        type: 'LAKE',
        groupId: 1,
        cells: [
          { r: 4, c: 5 }, { r: 4, c: 6 },
          { r: 5, c: 5 }, { r: 5, c: 6 },
        ],
      },
      {
        type: 'LAKE',
        groupId: 2,
        cells: [
          { r: 10, c: 9 }, { r: 10, c: 10 },
          { r: 11, c: 9 }, { r: 11, c: 10 },
        ],
      },
      {
        type: 'HOUSE',
        groupId: 1,
        cells: [
          { r: 7, c: 11 }, { r: 7, c: 12 },
        ],
      },
      { type: 'TREES', treeId: 1, cells: [{ r: 6, c: 3 }] },
      { type: 'TREES', treeId: 2, cells: [{ r: 13, c: 12 }] },
    ],
  },
  {
    id: 4,
    label: 'Open Floodplain',
    badge: 'Free Play',
    description: 'Wide-open valley with a central lake — experiment freely with multi-branch routes.',
    start: { edge: 'W', pos: 7 },
    end: { edge: 'E', pos: 8 },
    obstacles: [
      {
        type: 'LAKE',
        groupId: 1,
        cells: [
          { r: 6, c: 7 }, { r: 6, c: 8 },
          { r: 7, c: 7 }, { r: 7, c: 8 },
        ],
      },
      {
        type: 'HOUSE',
        groupId: 1,
        cells: [
          { r: 3, c: 4 }, { r: 3, c: 5 },
        ],
      },
    ],
  },
];
