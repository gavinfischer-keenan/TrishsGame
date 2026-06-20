/**
 * RiverLogic.js — Core engine for Build Me a River
 *
 * ─── Grid cell values ──────────────────────────────────────────────────────
 *   null
 *     Empty cell — a tile can be placed here.
 *
 *   { type:'obstacle', obstacleType:'ROCK' }
 *     Impassable. Nothing happens here.
 *
 *   { type:'obstacle', obstacleType:'HOUSE', groupId, connected:bool }
 *     A house block. Cells sharing the same groupId are the same house.
 *     connected = true once any tile is placed in an adjacent cell.
 *     When connected, every exterior side of every house cell acts as an
 *     open end (the house is a + junction that forces all connections).
 *     REDIRECT: when a tile is placed adjacent to a house, the tile is
 *     replaced with one that routes water directly into the house,
 *     regardless of what the player selected.
 *
 *   { type:'obstacle', obstacleType:'TREES', treeId, saturated:bool }
 *     A single-cell tree. Each tree is independent.
 *     saturated = true once a tile is placed with a connection pointing at it.
 *     A saturated tree won't absorb another supply.
 *     REDIRECT: when a tile is placed adjacent to an unsaturated tree, it is
 *     replaced with one that routes water into the tree (terminating the
 *     branch there). The tree then becomes saturated.
 *
 *   { type:'obstacle', obstacleType:'LAKE', groupId, filled:bool }
 *     A multi-cell reservoir. Cells sharing the same groupId are the same lake.
 *     filled = true when any tile with a connection pointing at any lake cell
 *     is placed (no redirect — player must aim at the lake explicitly).
 *     When filled, every exterior side of every lake cell acts as an open end.
 *
 *   { tileId:string }
 *     A placed river tile.
 *
 * ─── Redirect mechanic (trees & houses) ───────────────────────────────────
 *   When a tile is placed at (r,c) and there is an adjacent TREE or HOUSE:
 *     1. Collect entry directions (directions from which open ends point INTO
 *        this cell).
 *     2. Collect obstacle directions (directions to each adjacent tree/house).
 *     3. Build a connection set = entryDirs ∪ obstacleDirections.
 *     4. Derive the tile ID from this connection set (e.g. {W,N} → 'NW').
 *     5. Replace the player's chosen tile with this computed tile.
 *   This guarantees the water is routed into every adjacent tree/house,
 *   regardless of what tile the player selected.
 */

import { TILE_MAP, getTilesForEntry, getCandidateCells, OPPOSITE } from './RiverTiles';
import { scaleObstacles, scaleEdgePos } from './RiverLevels';

// Canonical direction sort order used to build tile IDs
const DIR_ORDER = { N: 0, S: 1, E: 2, W: 3 };

// ─── Utility ────────────────────────────────────────────────────────────────

export function moveInDir(r, c, dir) {
  switch (dir) {
    case 'N': return { r: r - 1, c };
    case 'S': return { r: r + 1, c };
    case 'E': return { r, c: c + 1 };
    case 'W': return { r, c: c - 1 };
    default:  return null;
  }
}

function oob(r, c, gridSize) {
  return r < 0 || r >= gridSize || c < 0 || c >= gridSize;
}

/**
 * Build a tile ID from an arbitrary set of connection directions.
 * e.g. ['W', 'N'] → 'NW'  (sorted by DIR_ORDER)
 */
function tileIdFromConnections(connections) {
  return [...connections]
    .sort((a, b) => DIR_ORDER[a] - DIR_ORDER[b])
    .join('');
}

// ─── Grid construction ──────────────────────────────────────────────────────

/**
 * Build the initial grid for a level at the given size.
 * Returns { grid, startOpenEnd }.
 */
export function buildInitialGrid(level, gridSize) {
  const grid = Array.from({ length: gridSize }, () => Array(gridSize).fill(null));

  const scaledObs = scaleObstacles(level.obstacles, gridSize);
  for (const obs of scaledObs) {
    for (const { r, c } of obs.cells) {
      if (r >= 0 && r < gridSize && c >= 0 && c < gridSize) {
        let cell;
        switch (obs.type) {
          case 'ROCK':
            cell = { type: 'obstacle', obstacleType: 'ROCK' };
            break;
          case 'HOUSE':
            cell = { type: 'obstacle', obstacleType: 'HOUSE', groupId: obs.groupId, connected: false };
            break;
          case 'TREES':
            cell = { type: 'obstacle', obstacleType: 'TREES', treeId: obs.treeId, saturated: false };
            break;
          case 'LAKE':
            cell = { type: 'obstacle', obstacleType: 'LAKE', groupId: obs.groupId, filled: false };
            break;
          default:
            cell = { type: 'obstacle', obstacleType: obs.type };
        }
        grid[r][c] = cell;
      }
    }
  }

  const startPos = scaleEdgePos(level.start.pos, gridSize);
  const startOpenEnd = edgeOpenEnd(level.start.edge, startPos, gridSize);
  return { grid, startOpenEnd };
}

function edgeOpenEnd(edge, pos, gridSize) {
  switch (edge) {
    case 'W': return { row: pos,       col: -1,       dir: 'E' };
    case 'E': return { row: pos,       col: gridSize, dir: 'W' };
    case 'N': return { row: -1,        col: pos,      dir: 'S' };
    case 'S': return { row: gridSize,  col: pos,      dir: 'N' };
    default:  return { row: pos,       col: -1,       dir: 'E' };
  }
}

export function getEndCell(level, gridSize) {
  const endPos = scaleEdgePos(level.end.pos, gridSize);
  switch (level.end.edge) {
    case 'W': return { row: endPos,          col: 0,            connectDir: 'W' };
    case 'E': return { row: endPos,          col: gridSize - 1, connectDir: 'E' };
    case 'N': return { row: 0,               col: endPos,       connectDir: 'N' };
    case 'S': return { row: gridSize - 1,    col: endPos,       connectDir: 'S' };
    default:  return { row: endPos,          col: gridSize - 1, connectDir: 'E' };
  }
}

// ─── Redirect mechanic helpers ──────────────────────────────────────────────

/**
 * From the current open-ends, find which entry directions lead INTO cell (row,col).
 */
function entryDirsForCell(row, col, openEnds, gridSize, grid) {
  const candidates = getCandidateCells(openEnds, gridSize, grid);
  const dirs = new Set();
  for (const { row: cr, col: cc, entryDir } of candidates) {
    if (cr === row && cc === col) dirs.add(entryDir);
  }
  return dirs;
}

/**
 * Compute the tile ID that should actually be placed at (row,col).
 *
 * Rules:
 *   - Start with all entry directions (from active open ends pointing here).
 *   - For each orthogonal neighbour that is an unprocessed TREE or any HOUSE:
 *       add the direction toward that neighbour to the connection set.
 *   - Derive the tile ID from the merged connection set.
 *   - If there are no tree/house neighbours, use the player's selected tile.
 */
function computeActualTile(row, col, entryDirs, grid, gridSize, selectedTileId) {
  const connections = new Set(entryDirs);
  let hasRedirect = false;

  for (const dir of ['N', 'E', 'S', 'W']) {
    const nb = moveInDir(row, col, dir);
    if (!nb || oob(nb.r, nb.c, gridSize)) continue;
    const nbCell = grid[nb.r][nb.c];
    if (!nbCell || nbCell.type !== 'obstacle') continue;

    if (nbCell.obstacleType === 'HOUSE') {
      connections.add(dir);
      hasRedirect = true;
    } else if (nbCell.obstacleType === 'TREES' && !nbCell.saturated) {
      connections.add(dir);
      hasRedirect = true;
    }
  }

  if (!hasRedirect) return selectedTileId;

  const derivedId = tileIdFromConnections(connections);
  // Verify the tile exists in our catalogue; fall back to selected if not
  return TILE_MAP[derivedId] ? derivedId : selectedTileId;
}

// ─── Obstacle effect application ────────────────────────────────────────────

/**
 * Mark all cells of an obstacle group with new state.
 */
function markGroup(grid, gridSize, obstacleType, groupId, updates) {
  const newGrid = grid.map(r => [...r]);
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const cell = newGrid[r][c];
      if (cell?.type === 'obstacle' &&
          cell.obstacleType === obstacleType &&
          cell.groupId === groupId) {
        newGrid[r][c] = { ...cell, ...updates };
      }
    }
  }
  return newGrid;
}

/**
 * Apply post-placement obstacle effects after placing tileId at (row,col).
 *
 * For each connection direction of the placed tile:
 *   - TREES neighbour (unsaturated) → mark saturated
 *   - HOUSE neighbour              → mark entire group connected
 *   - LAKE neighbour               → mark entire group filled
 *
 * Returns new (immutable) grid.
 */
export function applyObstacleEffects(grid, row, col, tileId, gridSize) {
  let g = grid.map(r => [...r]);
  const tile = TILE_MAP[tileId];
  if (!tile) return g;

  for (const dir of tile.connections) {
    const nb = moveInDir(row, col, dir);
    if (!nb || oob(nb.r, nb.c, gridSize)) continue;
    const nbCell = g[nb.r][nb.c];
    if (!nbCell || nbCell.type !== 'obstacle') continue;

    if (nbCell.obstacleType === 'TREES' && !nbCell.saturated) {
      g[nb.r][nb.c] = { ...nbCell, saturated: true };
    } else if (nbCell.obstacleType === 'HOUSE' && !nbCell.connected) {
      g = markGroup(g, gridSize, 'HOUSE', nbCell.groupId, { connected: true });
    } else if (nbCell.obstacleType === 'LAKE' && !nbCell.filled) {
      g = markGroup(g, gridSize, 'LAKE', nbCell.groupId, { filled: true });
    }
  }

  return g;
}

// ─── Full placement pipeline ─────────────────────────────────────────────────

/**
 * Full tile placement pipeline:
 *   1. Compute actual tile ID (redirect if adjacent to tree/house).
 *   2. Place tile on grid.
 *   3. Apply obstacle effects.
 *
 * Returns { grid: newGrid, actualTileId }
 */
export function processTilePlacement(grid, selectedTileId, row, col, openEnds, gridSize) {
  const entryDirs = entryDirsForCell(row, col, openEnds, gridSize, grid);
  const actualTileId = computeActualTile(row, col, entryDirs, grid, gridSize, selectedTileId);

  // Place tile
  const gridWithTile = grid.map(r => [...r]);
  gridWithTile[row][col] = { tileId: actualTileId };

  // Apply obstacle effects
  const finalGrid = applyObstacleEffects(gridWithTile, row, col, actualTileId, gridSize);

  return { grid: finalGrid, actualTileId };
}

// ─── Open-end computation ───────────────────────────────────────────────────

/**
 * Compute all open ends for the current board state.
 *
 * Sources of open ends:
 *   1. Start virtual tile — if first grid cell is still empty.
 *   2. Every placed tile's connections — those pointing at empty (null) cells.
 *   3. Connected HOUSE cells — all exterior sides facing empty cells.
 *   4. Filled LAKE cells — all exterior sides facing empty cells.
 *
 * Note: connections pointing at trees/rocks/unconnected houses/unfilled lakes
 * are NOT open ends (those branches are terminated or absorbed).
 */
export function computeOpenEnds(grid, startOpenEnds, gridSize) {
  const openEnds = [];

  // 1. Start open end (virtual source)
  for (const se of startOpenEnds) {
    const nb = moveInDir(se.row, se.col, se.dir);
    if (nb && !oob(nb.r, nb.c, gridSize) && grid[nb.r][nb.c] === null) {
      openEnds.push(se);
    }
  }

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const cell = grid[r][c];
      if (!cell) continue;

      if (cell.type === 'obstacle') {
        // 3. Connected HOUSE → open ends on all exterior empty sides
        if (cell.obstacleType === 'HOUSE' && cell.connected) {
          for (const dir of ['N', 'E', 'S', 'W']) {
            const nb = moveInDir(r, c, dir);
            if (!nb || oob(nb.r, nb.c, gridSize)) continue;
            if (grid[nb.r][nb.c] === null) openEnds.push({ row: r, col: c, dir });
          }
        }
        // 4. Filled LAKE → open ends on all exterior empty sides
        if (cell.obstacleType === 'LAKE' && cell.filled) {
          for (const dir of ['N', 'E', 'S', 'W']) {
            const nb = moveInDir(r, c, dir);
            if (!nb || oob(nb.r, nb.c, gridSize)) continue;
            if (grid[nb.r][nb.c] === null) openEnds.push({ row: r, col: c, dir });
          }
        }
        continue;
      }

      // 2. Placed tile connections → only toward empty cells
      const tile = TILE_MAP[cell.tileId];
      if (!tile) continue;

      for (const dir of tile.connections) {
        const nb = moveInDir(r, c, dir);
        if (!nb || oob(nb.r, nb.c, gridSize)) continue;
        if (grid[nb.r][nb.c] === null) {
          openEnds.push({ row: r, col: c, dir });
        }
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

// ─── Tile placement (simple, no effects) ────────────────────────────────────

/**
 * Immutably place a tile. Use processTilePlacement for the full pipeline.
 */
export function placeTile(grid, tileId, row, col) {
  const newGrid = grid.map(r => [...r]);
  newGrid[row][col] = { tileId };
  return newGrid;
}

/**
 * Returns the Set<"r,c"> of cells where tileId can legally be placed.
 */
export function getValidCells(tileId, openEnds, grid, gridSize) {
  const tile = TILE_MAP[tileId];
  if (!tile) return new Set();

  const validSet = new Set();
  const candidates = getCandidateCells(openEnds, gridSize, grid);

  for (const { row, col, entryDir } of candidates) {
    if (tile.connections.includes(entryDir)) {
      validSet.add(`${row},${col}`);
    }
  }
  return validSet;
}

// ─── Offer generation ───────────────────────────────────────────────────────

/**
 * Generate 3 guaranteed-playable tile IDs from the current open ends.
 * Returns { offer: string[]|null, isGameOver: bool }.
 */
export function generateOffer(openEnds, grid, gridSize) {
  const candidates = getCandidateCells(openEnds, gridSize, grid);
  const playableSet = new Set();

  for (const { entryDir } of candidates) {
    for (const id of getTilesForEntry(entryDir)) playableSet.add(id);
  }

  const pool = Array.from(playableSet);
  if (pool.length === 0) return { offer: null, isGameOver: true };

  const shuffled = pool.sort(() => Math.random() - 0.5);
  const offer = shuffled.slice(0, Math.min(3, shuffled.length));
  while (offer.length < 3) offer.push(pool[Math.floor(Math.random() * pool.length)]);

  return { offer, isGameOver: false };
}

// ─── Win / Loss detection ────────────────────────────────────────────────────

/**
 * Flood-fill from start to see if the river reaches the end.
 *
 * Traversal rules:
 *   - Placed tiles: follow their connections.
 *   - Connected HOUSE cells: spread through all cells of the group,
 *     then follow into any adjacent placed tile.
 *   - Filled LAKE cells: same as house.
 *   - Other obstacles, empty cells: stop.
 *
 * Win when the end cell contains a tile that connects toward the end edge.
 */
export function checkWin(grid, level, gridSize, startOpenEnd) {
  const endCell = getEndCell(level, gridSize);

  const sn = moveInDir(startOpenEnd.row, startOpenEnd.col, startOpenEnd.dir);
  if (!sn || oob(sn.r, sn.c, gridSize)) return false;
  if (!grid[sn.r][sn.c]) return false; // empty — nothing to traverse

  const visited = new Set();
  const visitedGroups = new Set();
  const queue = [{ r: sn.r, c: sn.c, fromDir: OPPOSITE[startOpenEnd.dir] }];

  const spreadGroup = (obstacleType, groupId) => {
    const gk = `${obstacleType}-${groupId}`;
    if (visitedGroups.has(gk)) return;
    visitedGroups.add(gk);

    for (let gr = 0; gr < gridSize; gr++) {
      for (let gc = 0; gc < gridSize; gc++) {
        const gCell = grid[gr][gc];
        if (!gCell || gCell.type !== 'obstacle') continue;
        if (gCell.obstacleType !== obstacleType || gCell.groupId !== groupId) continue;

        // Enqueue all non-empty, non-same-group neighbours
        for (const dir of ['N', 'E', 'S', 'W']) {
          const nb = moveInDir(gr, gc, dir);
          if (!nb || oob(nb.r, nb.c, gridSize)) continue;
          const nbCell = grid[nb.r][nb.c];
          if (!nbCell) continue; // empty — no tile to enter
          // Don't re-enter the same group
          if (nbCell.type === 'obstacle' && nbCell.groupId === groupId) continue;
          queue.push({ r: nb.r, c: nb.c, fromDir: OPPOSITE[dir] });
        }
      }
    }
  };

  while (queue.length > 0) {
    const { r, c, fromDir } = queue.shift();
    const vk = `${r},${c},${fromDir}`;
    if (visited.has(vk)) continue;
    visited.add(vk);

    const cell = grid[r][c];
    if (!cell) continue;

    if (cell.type === 'obstacle') {
      if (cell.obstacleType === 'HOUSE' && cell.connected) spreadGroup('HOUSE', cell.groupId);
      else if (cell.obstacleType === 'LAKE' && cell.filled) spreadGroup('LAKE', cell.groupId);
      continue;
    }

    // Placed tile
    const tile = TILE_MAP[cell.tileId];
    if (!tile || !tile.connections.includes(fromDir)) continue;

    // Win condition
    if (r === endCell.row && c === endCell.col && tile.connections.includes(endCell.connectDir)) {
      return true;
    }

    // Follow tile connections
    for (const dir of tile.connections) {
      if (dir === fromDir) continue;
      const nb = moveInDir(r, c, dir);
      if (!nb || oob(nb.r, nb.c, gridSize)) continue;
      const nbCell = grid[nb.r][nb.c];
      if (!nbCell) continue; // empty — dead end
      // Only enter connected houses and filled lakes (others are dead ends)
      if (nbCell.type === 'obstacle') {
        if ((nbCell.obstacleType === 'HOUSE' && nbCell.connected) ||
            (nbCell.obstacleType === 'LAKE' && nbCell.filled)) {
          queue.push({ r: nb.r, c: nb.c, fromDir: OPPOSITE[dir] });
        }
        continue;
      }
      queue.push({ r: nb.r, c: nb.c, fromDir: OPPOSITE[dir] });
    }
  }

  return false;
}

/**
 * The game is lost when no tile can legally be placed anywhere.
 * Called BEFORE generating a new offer.
 */
export function checkLoss(openEnds, grid, gridSize) {
  if (openEnds.length === 0) return true;
  const candidates = getCandidateCells(openEnds, gridSize, grid);
  if (candidates.length === 0) return true;
  for (const { entryDir } of candidates) {
    if (getTilesForEntry(entryDir).length > 0) return false;
  }
  return true;
}
