/**
 * RiverTiles.js
 * Defines all 11 river tile types and helper functions for
 * querying connections and open-end compatibility.
 *
 * Each tile has:
 *   id:          unique string key
 *   label:       human-readable name shown in the UI
 *   connections: array of directions ('N','E','S','W') this tile connects
 *   svgPath:     SVG path data (in a 100x100 viewBox) for the river channel
 */

export const OPPOSITE = { N: 'S', S: 'N', E: 'W', W: 'E' };

export const TILE_TYPES = [
  {
    id: 'NS',
    label: 'Straight ↕',
    connections: ['N', 'S'],
    // Vertical river channel through center
    svgPath: 'M 40 0 L 40 100 M 60 0 L 60 100',
    fillPath: 'M 40 0 L 60 0 L 60 100 L 40 100 Z',
  },
  {
    id: 'EW',
    label: 'Straight ↔',
    connections: ['E', 'W'],
    svgPath: 'M 0 40 L 100 40 M 0 60 L 100 60',
    fillPath: 'M 0 40 L 100 40 L 100 60 L 0 60 Z',
  },
  {
    id: 'NE',
    label: 'Bend ↑→',
    connections: ['N', 'E'],
    // River comes from North and exits East
    fillPath: 'M 40 0 L 60 0 L 60 60 Q 60 60 100 60 L 100 40 Q 40 40 40 0 Z',
  },
  {
    id: 'NW',
    label: 'Bend ↑←',
    connections: ['N', 'W'],
    fillPath: 'M 40 0 L 60 0 Q 60 40 0 40 L 0 60 Q 60 60 60 0 Z',
  },
  {
    id: 'SE',
    label: 'Bend ↓→',
    connections: ['S', 'E'],
    fillPath: 'M 40 100 L 60 100 Q 60 60 100 60 L 100 40 Q 40 40 40 100 Z',
  },
  {
    id: 'SW',
    label: 'Bend ↓←',
    connections: ['S', 'W'],
    fillPath: 'M 40 100 L 60 100 Q 60 40 0 40 L 0 60 Q 40 60 40 100 Z',
  },
  {
    id: 'NSE',
    label: 'T-Junction ↕→',
    connections: ['N', 'S', 'E'],
    fillPath: 'M 40 0 L 60 0 L 60 60 L 100 60 L 100 40 L 60 40 L 60 100 L 40 100 Z',
  },
  {
    id: 'NSW',
    label: 'T-Junction ↕←',
    connections: ['N', 'S', 'W'],
    fillPath: 'M 40 0 L 60 0 L 60 100 L 40 100 L 40 60 L 0 60 L 0 40 L 40 40 Z',
  },
  {
    id: 'NEW',
    label: 'T-Junction ↑↔',
    connections: ['N', 'E', 'W'],
    fillPath: 'M 0 40 L 100 40 L 100 60 L 60 60 L 60 0 L 40 0 L 40 60 L 0 60 Z',
  },
  {
    id: 'SEW',
    label: 'T-Junction ↓↔',
    connections: ['S', 'E', 'W'],
    fillPath: 'M 0 40 L 40 40 L 40 100 L 60 100 L 60 40 L 100 40 L 100 60 L 0 60 Z',
  },
  {
    id: 'NSEW',
    label: 'Crossroads ✛',
    connections: ['N', 'S', 'E', 'W'],
    fillPath: 'M 40 0 L 60 0 L 60 40 L 100 40 L 100 60 L 60 60 L 60 100 L 40 100 L 40 60 L 0 60 L 0 40 L 40 40 Z',
  },
];

/** Lookup map for fast access by id */
export const TILE_MAP = Object.fromEntries(TILE_TYPES.map(t => [t.id, t]));

/**
 * Returns all tile types that have a connection on the given direction.
 * Used to find which tiles can legally be placed in a cell entered from `dir`.
 * @param {string} dir - 'N'|'E'|'S'|'W'  (the direction the open-end points INTO the cell)
 * @returns {string[]} array of tile IDs
 */
export function getTilesForEntry(dir) {
  return TILE_TYPES.filter(t => t.connections.includes(dir)).map(t => t.id);
}

/**
 * Given an array of open ends (each is { row, col, dir } where dir is the
 * direction the open end points INTO the neighbouring cell), returns the
 * position and required entry direction for every candidate placement cell.
 *
 * @param {Array<{row:number,col:number,dir:string}>} openEnds
 * @param {number} gridSize
 * @param {Array<Array<object|null>>} grid  - current grid state
 * @returns {Array<{row:number,col:number,entryDir:string}>}
 */
export function getCandidateCells(openEnds, gridSize, grid) {
  const candidates = [];
  const seen = new Set();

  for (const { row, col, dir } of openEnds) {
    // The open end from (row,col) going dir → the neighbouring cell is:
    let nr = row, nc = col;
    if (dir === 'N') nr = row - 1;
    else if (dir === 'S') nr = row + 1;
    else if (dir === 'E') nc = col + 1;
    else if (dir === 'W') nc = col - 1;

    // Must be in bounds and empty
    if (nr < 0 || nr >= gridSize || nc < 0 || nc >= gridSize) continue;
    if (grid[nr][nc] !== null) continue;

    const key = `${nr},${nc},${OPPOSITE[dir]}`;
    if (!seen.has(key)) {
      seen.add(key);
      // entryDir = direction from which the water arrives (opposite of dir)
      candidates.push({ row: nr, col: nc, entryDir: OPPOSITE[dir] });
    }
  }
  return candidates;
}
