import { TILE_MAP } from './engine/RiverTiles';

/**
 * RiverBoard.jsx
 * SVG-based renderer for the Build Me a River game board.
 *
 * Props:
 *   grid          - 2D array of cell data (null | obstacle | {tileId})
 *   gridSize      - number (e.g. 16)
 *   level         - level definition object
 *   validCells    - Set<string> of "r,c" keys for valid placement highlights
 *   selectedTile  - tileId string or null (currently selected in offer)
 *   onCellClick   - (row, col) => void
 *   startOpenEnd  - {row, col, dir} for rendering the source sprite
 */

// Colors
const RIVER_BLUE = '#3b82f6';
const RIVER_BANK = '#1d4ed8';
const EMPTY_FILL = 'rgba(30,41,59,0.6)';
const EMPTY_STROKE = 'rgba(255,255,255,0.06)';
const VALID_FILL = 'rgba(34,197,94,0.18)';
const VALID_STROKE = 'rgba(34,197,94,0.7)';

const OBSTACLE_STYLES = {
  ROCK:  { fill: '#64748b', label: '🪨' },
  HOUSE: { fill: '#92400e', label: '🏠' },
  TREES: { fill: '#166534', label: '🌲' },
  LAKE:  { fill: '#1d4ed8', label: '💧' },
};

const EDGE_COLORS = {
  start: '#22c55e',
  end: '#f59e0b',
};

const RiverBoard = ({ grid, gridSize, level, validCells, selectedTile, onCellClick }) => {
  const cs = 100; // viewBox cell size in SVG units
  const vbSize = cs * gridSize;

  // Scaled start/end positions
  const scalePos = (pos) => Math.round(pos * (gridSize / 16));
  const startPos = scalePos(level.start.pos);
  const endPos = scalePos(level.end.pos);

  const edgeIndicator = (edge, pos, type) => {
    const color = EDGE_COLORS[type];
    const label = type === 'start' ? '▶' : '★';
    let x, y;

    const cellCenter = pos * cs + cs / 2;

    switch (edge) {
      case 'W':
        x = -cs * 0.6;
        y = cellCenter;
        break;
      case 'E':
        x = vbSize + cs * 0.6;
        y = cellCenter;
        break;
      case 'N':
        x = cellCenter;
        y = -cs * 0.6;
        break;
      case 'S':
        x = cellCenter;
        y = vbSize + cs * 0.6;
        break;
      default:
        x = 0; y = 0;
    }

    return (
      <g key={type}>
        <circle cx={x} cy={y} r={cs * 0.45} fill={color} opacity={0.9} />
        <text
          x={x} y={y}
          textAnchor="middle" dominantBaseline="central"
          fontSize={cs * 0.5} fill="white" fontWeight="bold"
        >
          {label}
        </text>
      </g>
    );
  };

  const renderCell = (r, c) => {
    const cell = grid[r][c];
    const x = c * cs;
    const y = r * cs;
    const key = `${r},${c}`;
    const isValid = selectedTile && validCells && validCells.has(key);

    // Empty cell
    if (cell === null) {
      return (
        <g key={key} onClick={() => isValid && onCellClick(r, c)} style={{ cursor: isValid ? 'pointer' : 'default' }}>
          <rect x={x} y={y} width={cs} height={cs}
            fill={isValid ? VALID_FILL : EMPTY_FILL}
            stroke={isValid ? VALID_STROKE : EMPTY_STROKE}
            strokeWidth={isValid ? 3 : 1}
          />
          {isValid && (
            <rect x={x + 2} y={y + 2} width={cs - 4} height={cs - 4}
              fill="none" stroke={VALID_STROKE} strokeWidth={2}
              strokeDasharray="8 4" opacity={0.7}
            />
          )}
        </g>
      );
    }

    // Obstacle cell
    if (cell.type === 'obstacle') {
      const style = OBSTACLE_STYLES[cell.obstacleType] || OBSTACLE_STYLES.ROCK;
      return (
        <g key={key}>
          <rect x={x} y={y} width={cs} height={cs} fill={style.fill} rx={4} />
          <text x={x + cs / 2} y={y + cs / 2}
            textAnchor="middle" dominantBaseline="central"
            fontSize={cs * 0.55}
          >
            {style.label}
          </text>
        </g>
      );
    }

    // Placed river tile
    const tile = TILE_MAP[cell.tileId];
    if (!tile) return null;

    return (
      <g key={key} transform={`translate(${x}, ${y}) scale(${cs / 100})`}>
        {/* Cell background */}
        <rect x={0} y={0} width={100} height={100} fill="#0f2544" />
        {/* River channel fill */}
        {tile.fillPath && (
          <path d={tile.fillPath} fill={RIVER_BLUE} opacity={0.85} />
        )}
        {/* River channel border/glow */}
        {tile.fillPath && (
          <path d={tile.fillPath} fill="none" stroke={RIVER_BANK} strokeWidth={2} opacity={0.6} />
        )}
      </g>
    );
  };

  return (
    <div className="river-board-wrapper">
      <svg
        viewBox={`${-cs * 0.9} ${-cs * 0.9} ${vbSize + cs * 1.8} ${vbSize + cs * 1.8}`}
        className="river-board-svg"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Board background */}
        <rect
          x={-cs * 0.05} y={-cs * 0.05}
          width={vbSize + cs * 0.1} height={vbSize + cs * 0.1}
          fill="rgba(15,23,42,0.95)"
          rx={8}
          stroke="rgba(59,130,246,0.25)" strokeWidth={4}
        />

        {/* Grid cells */}
        {Array.from({ length: gridSize }, (_, r) =>
          Array.from({ length: gridSize }, (_, c) => renderCell(r, c))
        )}

        {/* Start and End indicators */}
        {edgeIndicator(level.start.edge, startPos, 'start')}
        {edgeIndicator(level.end.edge, endPos, 'end')}
      </svg>
    </div>
  );
};

export default RiverBoard;
