/**
 * RiverLevels.js
 * Level definitions for Build Me a River.
 *
 * Level format:
 * {
 *   id:          number
 *   label:       string  (display name)
 *   description: string  (flavour text)
 *   gridSize:    number  (NxN grid)
 *   start:       { edge: 'N'|'E'|'S'|'W', pos: number }  (0-indexed cell on that edge)
 *   end:         { edge: 'N'|'E'|'S'|'W', pos: number }
 *   obstacles:   Array<{ type: 'ROCK'|'HOUSE'|'TREES'|'LAKE', cells: [{r,c}] }>
 *   comingSoon:  boolean (optional, if true the level is locked)
 * }
 *
 * The grid size shown to the user corresponds to the "sizeName" setting:
 *   'stream'  → 16x16
 *   'river'   → 32x32
 *   'flood'   → 64x64
 *
 * Obstacles scale proportionally when the grid size changes. They are
 * defined here for the base 16x16 grid; the game engine scales them.
 */

/** Maps user-facing size name to actual grid dimension */
export const SIZE_MAP = {
  stream: 16,
  river: 32,
  flood: 64,
};

export const SIZE_LABELS = [
  { key: 'stream', label: 'Stream', subtitle: '16×16' },
  { key: 'river',  label: 'River',  subtitle: '32×32' },
  { key: 'flood',  label: 'Flood',  subtitle: '64×64' },
];

/**
 * Scale a set of obstacle cells from the base 16x16 to a target grid size.
 * We multiply each coordinate by (targetSize / 16).
 */
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

/**
 * Scale start/end position from base 16 to targetSize.
 */
export function scaleEdgePos(pos, targetSize) {
  return Math.round(pos * (targetSize / 16));
}

/**
 * Get the open-end direction from a start edge:
 * Water flows inward, so an edge of 'W' means the open end points 'E'.
 */
export const EDGE_INWARD = { N: 'S', S: 'N', E: 'W', W: 'E' };

// ---------------------------------------------------------------------------
// Level Definitions (base 16×16)
// ---------------------------------------------------------------------------

export const LEVELS = [
  {
    id: 1,
    label: 'Tutorial',
    description: 'Find a path through the woods and past the old farmhouse.',
    // Start on West edge, row 7 (roughly middle)
    start: { edge: 'W', pos: 7 },
    // End on East edge, row 7
    end:   { edge: 'E', pos: 7 },
    obstacles: [
      // A lone rock in the middle path to force a detour
      { type: 'ROCK',  cells: [{ r: 7, c: 8 }] },
      // A second rock
      { type: 'ROCK',  cells: [{ r: 5, c: 5 }] },
      // A house (2×2) in the upper-centre area
      { type: 'HOUSE', cells: [{ r: 3, c: 7 }, { r: 3, c: 8 }, { r: 4, c: 7 }, { r: 4, c: 8 }] },
      // A small grove of trees
      { type: 'TREES', cells: [{ r: 10, c: 4 }] },
      { type: 'TREES', cells: [{ r: 10, c: 5 }] },
      { type: 'TREES', cells: [{ r: 11, c: 4 }] },
      // A small lake (3 cells)
      { type: 'LAKE',  cells: [{ r: 12, c: 9 }, { r: 12, c: 10 }, { r: 13, c: 9 }] },
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
