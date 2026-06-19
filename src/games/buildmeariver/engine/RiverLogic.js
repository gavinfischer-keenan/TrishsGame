/**
 * RiverLogic.js
 * Core game engine for Build Me a River.
 *
 * Key concepts:
 *
 *  grid[r][c]:
 *    null          → empty
 *    'obstacle'    → impassable (rock, house, trees, lake)
 *    { tileId, openEnds: ['N','E',...] }  → a placed river tile
 *      openEnds = connections that face an EMPTY neighbour (i.e. unconnected exits)
 *
 *  Open ends:
 *    Each placed tile contributes open ends: for each connection direction,
 *    if the neighbour in that direction is empty (or is the END sentinel),
 *    that direction is an open end.
 *
 *  Start:
 *    A virtual "source" tile sits just outside the grid at the start edge.
 *    It is treated as a pre-placed tile with one connection pointing inward.
 *    The first open end is always the cell adjacent to the start edge.
 *
 *  Win:
 *    When a placed tile has a connection that points directly at the END cell
 *    (i.e. the end edge's adjacent cell), the game is won.
 *
 *  Loss:
 *    After each placement, we compute whether ANY tile type could legally be
 *    placed anywhere. If none can, the game is lost.
 */

import { TILE_MAP, getTilesForEntry, getCandidateCells, OPPOSITE } from './RiverTiles';
import { scaleObstacles, scaleEdgePos } from './RiverLevels';

// ---------------------------------------------------------------------------
// Grid construction
// ---------------------------------------------------------------------------

/**
 * Build the initial empty grid for a level at the given grid size.
 * Marks obstacle cells, and returns the initial open-ends list.
 */
export function buildInitialGrid(level, gridSize) {
  // Create empty grid
  const grid = Array.from({ length: gridSize }, () =>
    Array(gridSize).fill(null)
  );

  // Place obstacles (scaled from the base 16×16)
  const scaledObstacles = scaleObstacles(level.obstacles, gridSize);
  for (const obs of scaledObstacles) {
    for (const { r, c } of obs.cells) {
      if (r >= 0 && r < gridSize && c >= 0 && c < gridSize) {
        grid[r][c] = { type: 'obstacle', obstacleType: obs.type };
      }
    }
  }

  // Compute start open-end
  const startPos = scaleEdgePos(level.start.pos, gridSize);
  const startOpenEnd = edgeOpenEnd(level.start.edge, startPos, gridSize);

  return { grid, startOpenEnd };
}

/**
 * Returns the open-end created by the start edge:
 * { row, col, dir } where (row,col) is the source tile's virtual position
 * and dir is the direction that points INTO the grid.
 */
function edgeOpenEnd(edge, pos, gridSize) {
  // The virtual "source" sits just outside:
  switch (edge) {
    case 'W': return { row: pos,          col: -1,        dir: 'E' };
    case 'E': return { row: pos,          col: gridSize,  dir: 'W' };
    case 'N': return { row: -1,           col: pos,       dir: 'S' };
    case 'S': return { row: gridSize,     col: pos,       dir: 'N' };
    default:  return { row: pos,          col: -1,        dir: 'E' };
  }
}

/**
 * Returns the (row, col) of the end cell — the grid cell adjacent to the
 * end edge. The tile placed there must connect toward the end.
 */
export function getEndCell(level, gridSize) {
  const endPos = scaleEdgePos(level.end.pos, gridSize);
  switch (level.end.edge) {
    case 'W': return { row: endPos, col: 0,            connectDir: 'W' };
    case 'E': return { row: endPos, col: gridSize - 1, connectDir: 'E' };
    case 'N': return { row: 0,      col: endPos,       connectDir: 'N' };
    case 'S': return { row: gridSize - 1, col: endPos, connectDir: 'S' };
    default:  return { row: endPos, col: gridSize - 1, connectDir: 'E' };
  }
}

// ---------------------------------------------------------------------------
// Open-end computation
// ---------------------------------------------------------------------------

/**
 * Compute all open ends for the full current board state.
 * An open end is a connection of a placed tile that points into an empty cell.
 *
 * @param {Array<Array>} grid
 * @param {Array<{row,col,dir}>} startOpenEnds - always [startOpenEnd] initially
 * @param {number} gridSize
 * @param {object} level
 * @returns {Array<{row,col,dir}>}
 */
export function computeOpenEnds(grid, startOpenEnds, gridSize) {
  const openEnds = [];

  // Check start open ends (virtual source tile)
  for (const se of startOpenEnds) {
    const { row, col, dir } = se;
    let nr = row, nc = col;
    if (dir === 'N') nr--;
    else if (dir === 'S') nr++;
    else if (dir === 'E') nc++;
    else if (dir === 'W') nc--;

    // If the neighbour is still empty (or is the end cell), keep this open end
    if (nr >= 0 && nr < gridSize && nc >= 0 && nc < gridSize) {
      if (grid[nr][nc] === null) {
        openEnds.push(se);
      }
      // If the neighbour is a tile, its open ends will be computed below
    }
  }

  // Check all placed tiles
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const cell = grid[r][c];
      if (!cell || cell.type === 'obstacle') continue;

      const tile = TILE_MAP[cell.tileId];
      if (!tile) continue;

      for (const dir of tile.connections) {
        let nr = r, nc = c;
        if (dir === 'N') nr--;
        else if (dir === 'S') nr++;
        else if (dir === 'E') nc++;
        else if (dir === 'W') nc--;

        // Out of bounds → skip (unless it's the end edge direction)
        if (nr < 0 || nr >= gridSize || nc < 0 || nc >= gridSize) continue;

        const neighbour = grid[nr][nc];
        if (neighbour === null) {
          // Open empty cell → this is an open end
          openEnds.push({ row: r, col: c, dir });
        }
        // If neighbour is a tile or obstacle, not an open end
      }
    }
  }

  // Deduplicate
  const seen = new Set();
  return openEnds.filter(oe => {
    const key = `${oe.row},${oe.col},${oe.dir}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ---------------------------------------------------------------------------
// Tile placement
// ---------------------------------------------------------------------------

/**
 * Place a tile on the grid. Returns the new grid (immutable).
 * Does NOT mutate the input grid.
 *
 * @param {Array<Array>} grid
 * @param {string} tileId
 * @param {number} row
 * @param {number} col
 * @returns {Array<Array>}
 */
export function placeTile(grid, tileId, row, col) {
  const newGrid = grid.map(r => [...r]);
  newGrid[row][col] = { tileId };
  return newGrid;
}

/**
 * Returns all valid cells where a specific tile can be placed.
 * A cell is valid if:
 *   1. It is empty (null)
 *   2. It is adjacent to at least one open end
 *   3. The tile has a connection on the side matching that open end
 *
 * @param {string} tileId
 * @param {Array<{row,col,dir}>} openEnds
 * @param {Array<Array>} grid
 * @param {number} gridSize
 * @returns {Set<string>}  set of "r,c" strings
 */
export function getValidCells(tileId, openEnds, grid, gridSize) {
  const tile = TILE_MAP[tileId];
  if (!tile) return new Set();

  const validSet = new Set();
  const candidates = getCandidateCells(openEnds, gridSize, grid);

  for (const { row, col, entryDir } of candidates) {
    // The tile must have a connection on the entryDir side
    if (tile.connections.includes(entryDir)) {
      validSet.add(`${row},${col}`);
    }
  }

  return validSet;
}

// ---------------------------------------------------------------------------
// Offer generation (guaranteed all 3 are playable)
// ---------------------------------------------------------------------------

/**
 * Generate 3 tile IDs that are ALL guaranteed to be playable given the
 * current open ends.
 *
 * Algorithm:
 *  1. Compute candidate cells from open ends.
 *  2. For each candidate cell, find all tile types whose connections include entryDir.
 *  3. Union all playable tile IDs across all candidates → valid pool.
 *  4. If pool size < 3: game over (return null).
 *  5. Randomly sample 3 unique IDs from the pool (no repeats).
 *
 * @param {Array<{row,col,dir}>} openEnds
 * @param {Array<Array>} grid
 * @param {number} gridSize
 * @returns {{ offer: string[]|null, isGameOver: boolean }}
 */
export function generateOffer(openEnds, grid, gridSize) {
  const candidates = getCandidateCells(openEnds, gridSize, grid);

  // Build pool of playable tile IDs
  const playableSet = new Set();
  for (const { entryDir } of candidates) {
    const tileIds = getTilesForEntry(entryDir);
    for (const id of tileIds) playableSet.add(id);
  }

  const pool = Array.from(playableSet);

  if (pool.length === 0) {
    return { offer: null, isGameOver: true };
  }

  // Sample 3 unique tiles (or fewer if pool is small, but that shouldn't happen
  // with 11 tile types unless severely constrained)
  const shuffled = pool.sort(() => Math.random() - 0.5);
  const offer = shuffled.slice(0, Math.min(3, shuffled.length));

  // Pad to 3 if needed (repeat tiles — very rare edge case)
  while (offer.length < 3) {
    offer.push(pool[Math.floor(Math.random() * pool.length)]);
  }

  return { offer, isGameOver: false };
}

// ---------------------------------------------------------------------------
// Win / Loss detection
// ---------------------------------------------------------------------------

/**
 * Check if the river has been completed (connected start to end).
 *
 * Flood fill from the start's first open-end neighbour. If we reach the
 * end cell AND the tile there connects toward the end edge, win!
 *
 * @param {Array<Array>} grid
 * @param {object} level
 * @param {number} gridSize
 * @param {{row,col,dir}} startOpenEnd
 * @returns {boolean}
 */
export function checkWin(grid, level, gridSize, startOpenEnd) {
  const endCell = getEndCell(level, gridSize);

  // BFS/DFS flood fill through connected tiles from start
  const startNeighbour = getNeighbour(startOpenEnd.row, startOpenEnd.col, startOpenEnd.dir);
  if (!startNeighbour) return false;
  const { r: sr, c: sc } = startNeighbour;
  if (sr < 0 || sr >= gridSize || sc < 0 || sc >= gridSize) return false;
  if (!grid[sr][sc] || grid[sr][sc].type === 'obstacle') return false;

  const visited = new Set();
  const queue = [{ r: sr, c: sc, fromDir: OPPOSITE[startOpenEnd.dir] }];

  while (queue.length > 0) {
    const { r, c, fromDir } = queue.shift();
    const key = `${r},${c}`;
    if (visited.has(key)) continue;
    visited.add(key);

    const cell = grid[r][c];
    if (!cell || cell.type === 'obstacle') continue;

    const tile = TILE_MAP[cell.tileId];
    if (!tile) continue;
    // Tile must connect on the side we entered from
    if (!tile.connections.includes(fromDir)) continue;

    // Check win: are we at the end cell and does the tile connect toward the end?
    if (r === endCell.row && c === endCell.col &&
        tile.connections.includes(endCell.connectDir)) {
      return true;
    }

    // Continue flood fill
    for (const dir of tile.connections) {
      if (dir === fromDir) continue; // don't backtrack
      const nb = getNeighbour(r, c, dir);
      if (!nb) continue;
      const { r: nr, c: nc } = nb;
      if (nr < 0 || nr >= gridSize || nc < 0 || nc >= gridSize) continue;
      if (!grid[nr][nc] || grid[nr][nc].type === 'obstacle') continue;
      if (!visited.has(`${nr},${nc}`)) {
        queue.push({ r: nr, c: nc, fromDir: OPPOSITE[dir] });
      }
    }
  }

  return false;
}

/**
 * Check if the game is lost (no tile can be legally placed anywhere).
 * This is called BEFORE generating a new offer.
 *
 * @param {Array<{row,col,dir}>} openEnds
 * @param {Array<Array>} grid
 * @param {number} gridSize
 * @returns {boolean}
 */
export function checkLoss(openEnds, grid, gridSize) {
  if (openEnds.length === 0) return true;

  const candidates = getCandidateCells(openEnds, gridSize, grid);
  if (candidates.length === 0) return true;

  // Check if at least one tile type fits at least one candidate cell
  for (const { entryDir } of candidates) {
    const fits = getTilesForEntry(entryDir);
    if (fits.length > 0) return false;
  }

  return true;
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function getNeighbour(r, c, dir) {
  switch (dir) {
    case 'N': return { r: r - 1, c };
    case 'S': return { r: r + 1, c };
    case 'E': return { r, c: c + 1 };
    case 'W': return { r, c: c - 1 };
    default: return null;
  }
}
