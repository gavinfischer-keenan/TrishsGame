import { TILE_MAP } from './engine/RiverTiles';

/**
 * RiverBoard.jsx — SVG board renderer for Build Me a River.
 *
 * Obstacle visual states:
 *   ROCK              — gray slate, impassable
 *   HOUSE unconnected — dark brown, dormant
 *   HOUSE connected   — warm amber glow, water flowing through
 *   TREES unsaturated — dark forest green, ready to absorb
 *   TREES saturated   — bright lime green + water-drop icon, "drunk its fill"
 *   LAKE unfilled     — deep navy, dry reservoir
 *   LAKE filled       — bright cyan glow + wave icons, full reservoir
 */

const RIVER_BLUE  = '#3b82f6';
const RIVER_BANK  = '#1d4ed8';
const EMPTY_FILL  = 'rgba(30,41,59,0.6)';
const EMPTY_STR   = 'rgba(255,255,255,0.06)';
const VALID_FILL  = 'rgba(34,197,94,0.18)';
const VALID_STR   = 'rgba(34,197,94,0.7)';

const EDGE_COLORS = { start: '#22c55e', end: '#f59e0b' };

// ─── Obstacle renderers ──────────────────────────────────────────────────────

function RenderRock({ x, y, cs }) {
  return (
    <g>
      <rect x={x} y={y} width={cs} height={cs} fill="#334155" rx={4} />
      <rect x={x+4} y={y+4} width={cs-8} height={cs-8} fill="#475569" rx={3} />
      <text x={x+cs/2} y={y+cs/2} textAnchor="middle" dominantBaseline="central"
        fontSize={cs * 0.52}>🪨</text>
    </g>
  );
}

function RenderHouse({ x, y, cs, connected }) {
  const bg      = connected ? '#92400e' : '#44200a';
  const topBar  = connected ? '#d97706' : '#78350f';
  const glow    = connected ? '#fbbf24' : null;
  return (
    <g>
      <rect x={x} y={y} width={cs} height={cs} fill={bg} rx={3} />
      <rect x={x} y={y} width={cs} height={cs * 0.18} fill={topBar} rx={3} />
      {glow && (
        <>
          <rect x={x-3} y={y-3} width={cs+6} height={cs+6}
            fill="none" stroke={glow} strokeWidth={4} rx={5} opacity={0.7} />
          <rect x={x-1} y={y-1} width={cs+2} height={cs+2}
            fill="none" stroke={glow} strokeWidth={1.5} rx={4} opacity={0.35} />
        </>
      )}
      <text x={x+cs/2} y={y+cs*0.58} textAnchor="middle" dominantBaseline="central"
        fontSize={cs * 0.52}>🏠</text>
      {connected && (
        <text x={x+cs*0.82} y={y+cs*0.18} textAnchor="middle" dominantBaseline="central"
          fontSize={cs * 0.28}>💧</text>
      )}
    </g>
  );
}

function RenderTrees({ x, y, cs, saturated }) {
  const bg    = saturated ? '#15803d' : '#14532d';
  const emoji = saturated ? '🌳' : '🌲';
  return (
    <g>
      <rect x={x} y={y} width={cs} height={cs} fill={bg} rx={3} />
      {saturated && (
        <>
          {/* bright green pulse ring when saturated */}
          <rect x={x-2} y={y-2} width={cs+4} height={cs+4}
            fill="none" stroke="#4ade80" strokeWidth={3} rx={4} opacity={0.6} />
          <rect x={x+2} y={y+2} width={cs-4} height={cs-4}
            fill="#22c55e" rx={2} opacity={0.15} />
        </>
      )}
      <text x={x+cs/2} y={y+cs/2} textAnchor="middle" dominantBaseline="central"
        fontSize={cs * 0.52}>{emoji}</text>
      {saturated && (
        <text x={x+cs*0.78} y={y+cs*0.22} textAnchor="middle" dominantBaseline="central"
          fontSize={cs * 0.28}>💧</text>
      )}
    </g>
  );
}

function RenderLake({ x, y, cs, filled }) {
  const bg = filled ? '#0369a1' : '#1e3a5f';
  return (
    <g>
      <rect x={x} y={y} width={cs} height={cs} fill={bg} rx={2} />
      {filled && (
        <>
          <rect x={x-3} y={y-3} width={cs+6} height={cs+6}
            fill="none" stroke="#38bdf8" strokeWidth={4} rx={4} opacity={0.65} />
          <rect x={x} y={y} width={cs} height={cs}
            fill="#0ea5e9" rx={2} opacity={0.2} />
        </>
      )}
      <text x={x+cs/2} y={y+cs/2} textAnchor="middle" dominantBaseline="central"
        fontSize={cs * 0.52}>{filled ? '🌊' : '💧'}</text>
    </g>
  );
}

// ─── Board component ─────────────────────────────────────────────────────────

const RiverBoard = ({ grid, gridSize, level, validCells, selectedTile, onCellClick }) => {
  const cs = 100; // SVG units per cell
  const vbSize = cs * gridSize;

  const scalePos = pos => Math.round(pos * (gridSize / 16));
  const startPos = scalePos(level.start.pos);
  const endPos   = scalePos(level.end.pos);

  const edgeIndicator = (edge, pos, type) => {
    const color = EDGE_COLORS[type];
    const label = type === 'start' ? '▶' : '★';
    const cx = pos * cs + cs / 2;
    let x, y;
    switch (edge) {
      case 'W': x = -cs * 0.6; y = cx; break;
      case 'E': x = vbSize + cs * 0.6; y = cx; break;
      case 'N': x = cx; y = -cs * 0.6; break;
      case 'S': x = cx; y = vbSize + cs * 0.6; break;
      default:  x = 0; y = 0;
    }
    return (
      <g key={type}>
        <circle cx={x} cy={y} r={cs * 0.45} fill={color} opacity={0.9} />
        <text x={x} y={y} textAnchor="middle" dominantBaseline="central"
          fontSize={cs * 0.48} fill="white" fontWeight="bold">{label}</text>
      </g>
    );
  };

  const renderCell = (r, c) => {
    const cell  = grid[r][c];
    const x     = c * cs;
    const y     = r * cs;
    const key   = `${r},${c}`;
    const isValid = selectedTile && validCells?.has(key);

    // Empty
    if (cell === null) {
      return (
        <g key={key} onClick={() => isValid && onCellClick(r, c)}
          style={{ cursor: isValid ? 'pointer' : 'default' }}>
          <rect x={x} y={y} width={cs} height={cs}
            fill={isValid ? VALID_FILL : EMPTY_FILL}
            stroke={isValid ? VALID_STR : EMPTY_STR}
            strokeWidth={isValid ? 3 : 1} />
          {isValid && (
            <rect x={x+2} y={y+2} width={cs-4} height={cs-4}
              fill="none" stroke={VALID_STR} strokeWidth={2}
              strokeDasharray="8 4" opacity={0.7} />
          )}
        </g>
      );
    }

    // Obstacle
    if (cell.type === 'obstacle') {
      const props = { x, y, cs, key };
      switch (cell.obstacleType) {
        case 'ROCK':  return <RenderRock  {...props} />;
        case 'HOUSE': return <RenderHouse {...props} connected={cell.connected} />;
        case 'TREES': return <RenderTrees {...props} saturated={cell.saturated} />;
        case 'LAKE':  return <RenderLake  {...props} filled={cell.filled} />;
        default: return (
          <g key={key}>
            <rect x={x} y={y} width={cs} height={cs} fill="#334155" rx={3} />
          </g>
        );
      }
    }

    // Placed river tile
    const tile = TILE_MAP[cell.tileId];
    if (!tile) return null;

    return (
      <g key={key} transform={`translate(${x},${y}) scale(${cs/100})`}>
        <rect x={0} y={0} width={100} height={100} fill="#0f2544" />
        {tile.fillPath && <path d={tile.fillPath} fill={RIVER_BLUE} opacity={0.85} />}
        {tile.fillPath && <path d={tile.fillPath} fill="none" stroke={RIVER_BANK} strokeWidth={2} opacity={0.6} />}
      </g>
    );
  };

  return (
    <div className="river-board-wrapper">
      <svg
        viewBox={`${-cs*0.9} ${-cs*0.9} ${vbSize+cs*1.8} ${vbSize+cs*1.8}`}
        className="river-board-svg"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Board background */}
        <rect x={-cs*0.05} y={-cs*0.05}
          width={vbSize+cs*0.1} height={vbSize+cs*0.1}
          fill="rgba(15,23,42,0.95)" rx={8}
          stroke="rgba(59,130,246,0.25)" strokeWidth={4} />

        {/* Cells */}
        {Array.from({ length: gridSize }, (_, r) =>
          Array.from({ length: gridSize }, (_, c) => renderCell(r, c))
        )}

        {/* Start / End indicators */}
        {edgeIndicator(level.start.edge, startPos, 'start')}
        {edgeIndicator(level.end.edge,   endPos,   'end')}
      </svg>
    </div>
  );
};

export default RiverBoard;
