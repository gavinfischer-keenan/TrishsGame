/**
 * RiverLevels.js
 * Level definitions for Build Me a River.
 *
 * Obstacle format:
 *   ROCK:   { type:'ROCK',  cells:[{r,c}] }
 *   HOUSE:  { type:'HOUSE', groupId:number, cells:[{r,c},...] }
 *           groupId groups all cells of the SAME house together.
 *   TREES:  { type:'TREES', treeId:number, cells:[{r,c}] }
 *           Each tree is a separate obstacle with its own treeId.
 *   LAKE:   { type:'LAKE',  groupId:number, cells:[{r,c},...] }
 *           groupId groups all cells of the SAME lake together.
 *
 * All positions are defined for the base 16×16 grid and scaled
 * proportionally for larger grid sizes.
 */

export const SIZE_MAP = {
  stream: 16,
  river:  32,
  flood:  64,
};

export const SIZE_LABELS = [
  { key: 'stream', label: 'Stream', subtitle: '16×16' },
  { key: 'river',  label: 'River',  subtitle: '32×32' },
  { key: 'flood',  label: 'Flood',  subtitle: '64×64' },
];

export function scaleObstacles(obstacles, targetSize) {
  const scale = targetSize / 16;
  return obstacles.map(obs => ({
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

// ---------------------------------------------------------------------------
// Level Definitions (base 16×16)
// ---------------------------------------------------------------------------

export const LEVELS = [
  {
    id: 1,
    label: 'Tutorial',
    description: 'Find a path through the woods and past the old farmhouse.',
    start: { edge: 'W', pos: 7 },
    end:   { edge: 'E', pos: 7 },
    obstacles: [
      // Rocks — impassable
      { type: 'ROCK',  cells: [{ r: 7, c: 8 }] },
      { type: 'ROCK',  cells: [{ r: 5, c: 5 }] },
      // House — 2×2 block; connects when any adjacent tile is placed
      { type: 'HOUSE', groupId: 1, cells: [
          { r: 3, c: 7 }, { r: 3, c: 8 },
          { r: 4, c: 7 }, { r: 4, c: 8 },
        ],
      },
      // Trees — each is independent; absorbs the first water supply pointing at it
      { type: 'TREES', treeId: 1, cells: [{ r: 10, c: 4 }] },
      { type: 'TREES', treeId: 2, cells: [{ r: 10, c: 5 }] },
      { type: 'TREES', treeId: 3, cells: [{ r: 11, c: 4 }] },
      // Lake — shared reservoir; fills when any connected tile points at it
      { type: 'LAKE',  groupId: 1, cells: [
          { r: 12, c: 9 }, { r: 12, c: 10 }, { r: 13, c: 9 },
        ],
      },
    ],
  },
  {
    id: 2,
    label: 'Coming Soon',
    description: 'A new challenge is on the way...',
    start: { edge: 'N', pos: 7 },
    end:   { edge: 'S', pos: 7 },
    obstacles: [],
    comingSoon: true,
  },
  {
    id: 3,
    label: 'Coming Soon',
    description: 'Even more adventure ahead...',
    start: { edge: 'W', pos: 3 },
    end:   { edge: 'E', pos: 12 },
    obstacles: [],
    comingSoon: true,
  },
];
