import { useState, useCallback, useEffect, useMemo } from 'react';
import ConfettiBurst from '../../components/ConfettiBurst';
import ShareResultButton from '../../components/ShareResultButton';
import { playTone } from '../../utils/storage';

// ─── Constants ───────────────────────────────────────────────────────────────

const BOARD_SIZE = 10;
const EMPTY = 0;
const HIT = 2;
const MISS = 3;

const SHIPS = [
  { id: 'carrier', name: 'Carrier', size: 5, icon: '🛸' },
  { id: 'heavy-cruiser', name: 'Heavy Cruiser', size: 4, icon: '⚓' },
  { id: 'cruiser', name: 'Cruiser', size: 3, icon: '🚢' },
  { id: 'submarine', name: 'Submarine', size: 3, icon: '🤿' },
  { id: 'destroyer', name: 'Destroyer', size: 2, icon: '⚡' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const makeBoard = () => Array(BOARD_SIZE).fill(0).map(() => Array(BOARD_SIZE).fill(EMPTY));

const canPlace = (board, row, col, size, horiz) => {
  for (let i = 0; i < size; i++) {
    const r = horiz ? row : row + i;
    const c = horiz ? col + i : col;
    if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) return false;
    if (board[r][c] !== EMPTY) return false;
  }
  return true;
};

const placeShipOnBoard = (board, row, col, size, horiz, shipId) => {
  const next = board.map((r) => [...r]);
  for (let i = 0; i < size; i++) {
    const r = horiz ? row : row + i;
    const c = horiz ? col + i : col;
    next[r][c] = shipId;
  }
  return next;
};

const randomAIBoard = () => {
  let board = makeBoard();
  for (const ship of SHIPS) {
    let placed = false;
    while (!placed) {
      const horiz = Math.random() < 0.5;
      const row = Math.floor(Math.random() * BOARD_SIZE);
      const col = Math.floor(Math.random() * BOARD_SIZE);
      if (canPlace(board, row, col, ship.size, horiz)) {
        board = placeShipOnBoard(board, row, col, ship.size, horiz, ship.id);
        placed = true;
      }
    }
  }
  return board;
};

const checkAllSunk = (shipBoard, hitBoard) => {
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (shipBoard[r][c] !== EMPTY && hitBoard[r][c] !== HIT) return false;
    }
  }
  return true;
};

const isShipSunk = (shipId, shipBoard, hitBoard) => {
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (shipBoard[r][c] === shipId && hitBoard[r][c] !== HIT) return false;
    }
  }
  return true;
};

// ─── AI Logic ─────────────────────────────────────────────────────────────────

const aiShoot = (playerHitBoard, aiMemory) => {
  const already = (r, c) => playerHitBoard[r][c] !== EMPTY;

  if (aiMemory.mode === 'target' && aiMemory.queue.length > 0) {
    const [r, c] = aiMemory.queue[0];
    const newQueue = aiMemory.queue.slice(1).filter(([tr, tc]) => !already(tr, tc));
    return { r, c, newMemory: { ...aiMemory, queue: newQueue } };
  }

  let r;
  let c;
  let tries = 0;
  do {
    r = Math.floor(Math.random() * BOARD_SIZE);
    c = Math.floor(Math.random() * BOARD_SIZE);
    tries++;
  } while (already(r, c) && tries < 200);

  return { r, c, newMemory: { mode: 'hunt', hits: [], queue: [] } };
};

const updateAIMemoryAfterHit = (memory, r, c, hitBoard) => {
  const hits = [...memory.hits, [r, c]];
  const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
  const candidates = [];
  for (const [dr, dc] of dirs) {
    const nr = r + dr;
    const nc = c + dc;
    if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && hitBoard[nr][nc] === EMPTY) {
      candidates.push([nr, nc]);
    }
  }
  const existingStr = new Set(memory.queue.map(([a, b]) => `${a},${b}`));
  const queue = [...memory.queue, ...candidates.filter(([a, b]) => !existingStr.has(`${a},${b}`))];
  return { mode: 'target', hits, queue };
};

// ─── Setup Board Cell ─────────────────────────────────────────────────────────

const SetupCell = ({ shipId, preview, previewValid, isDragging, onMouseDown, onMouseUp, onMouseEnter }) => {
  let cls = 'fleet-tactics-cell';

  if (preview) {
    cls += previewValid ? ' fleet-tactics-cell-preview-valid' : ' fleet-tactics-cell-preview-invalid';
  } else if (shipId) {
    cls += ' fleet-tactics-cell-ship';
    cls += isDragging ? ' fleet-tactics-cell-ship-dragging' : ' fleet-tactics-cell-ship-grabbable';
  } else {
    cls += ' fleet-tactics-cell-water';
  }

  return (
    <div
      className={cls}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onMouseEnter={onMouseEnter}
    />
  );
};

// ─── Setup Board ──────────────────────────────────────────────────────────────

const SetupBoard = ({
  shipBoard,
  previewCells,
  draggingShipId,
  onCellMouseDown,
  onCellMouseUp,
  onCellHover,
  onBoardLeave,
}) => (
  <div className="fleet-tactics-board" onMouseLeave={onBoardLeave}>
    <div className="fleet-tactics-label-row">
      <div className="fleet-tactics-label-corner" />
      {Array.from({ length: BOARD_SIZE }, (_, i) => (
        <div key={i} className="fleet-tactics-label-cell">{String.fromCharCode(65 + i)}</div>
      ))}
    </div>
    {Array.from({ length: BOARD_SIZE }, (_, r) => (
      <div key={r} className="fleet-tactics-row">
        <div className="fleet-tactics-label-cell">{r + 1}</div>
        {Array.from({ length: BOARD_SIZE }, (_, c) => {
          const shipId = shipBoard[r][c] || null;
          const prev = previewCells.find((p) => p.r === r && p.c === c);
          return (
            <SetupCell
              key={c}
              shipId={prev ? null : shipId}
              preview={!!prev}
              previewValid={prev ? prev.valid : false}
              isDragging={shipId === draggingShipId}
              onMouseDown={() => onCellMouseDown(r, c)}
              onMouseUp={() => onCellMouseUp(r, c)}
              onMouseEnter={() => onCellHover(r, c)}
            />
          );
        })}
      </div>
    ))}
  </div>
);

// ─── Battle Board Cell ────────────────────────────────────────────────────────

const BattleCell = ({ state, shipId, isEnemy, isSunk, onClick }) => {
  let cls = 'fleet-tactics-cell';
  if (isEnemy) {
    cls += ' fleet-tactics-cell-enemy';
    if (state === MISS) cls += ' fleet-tactics-cell-miss';
    else if (state === HIT) cls += isSunk ? ' fleet-tactics-cell-sunk' : ' fleet-tactics-cell-hit';
    else cls += ' fleet-tactics-cell-unknown';
  } else {
    if (state === MISS) cls += ' fleet-tactics-cell-miss';
    else if (state === HIT) cls += isSunk ? ' fleet-tactics-cell-sunk' : ' fleet-tactics-cell-hit';
    else if (shipId) cls += isSunk ? ' fleet-tactics-cell-ship fleet-tactics-cell-sunk' : ' fleet-tactics-cell-ship';
    else cls += ' fleet-tactics-cell-water';
  }
  return <div className={cls} onClick={onClick} />;
};

const BattleBoard = ({ shipBoard, hitBoard, isEnemy, onCellClick, disabled }) => (
  <div className="fleet-tactics-board">
    <div className="fleet-tactics-label-row">
      <div className="fleet-tactics-label-corner" />
      {Array.from({ length: BOARD_SIZE }, (_, i) => (
        <div key={i} className="fleet-tactics-label-cell">{String.fromCharCode(65 + i)}</div>
      ))}
    </div>
    {Array.from({ length: BOARD_SIZE }, (_, r) => (
      <div key={r} className="fleet-tactics-row">
        <div className="fleet-tactics-label-cell">{r + 1}</div>
        {Array.from({ length: BOARD_SIZE }, (_, c) => {
          const shipId = shipBoard ? shipBoard[r][c] : null;
          const state = hitBoard ? hitBoard[r][c] : EMPTY;
          const sunk = shipId && hitBoard ? isShipSunk(shipId, shipBoard, hitBoard) : false;
          return (
            <BattleCell
              key={c}
              state={state}
              shipId={isEnemy ? null : shipId}
              isEnemy={isEnemy}
              isSunk={sunk}
              onClick={() => !disabled && onCellClick && onCellClick(r, c)}
            />
          );
        })}
      </div>
    ))}
  </div>
);

// ─── Phase: Setup ─────────────────────────────────────────────────────────────

const SetupPhase = ({ onReady, onExit }) => {
  const [playerBoard, setPlayerBoard] = useState(makeBoard());
  const [placed, setPlaced] = useState({});
  const [selectedShip, setSelectedShip] = useState(SHIPS[0].id);
  const [horiz, setHoriz] = useState(true);
  const [hover, setHover] = useState(null);
  const [dragging, setDragging] = useState(null);

  const allPlaced = SHIPS.every((s) => placed[s.id]);
  const nextUnplaced = SHIPS.find((s) => !placed[s.id]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setHoriz((h) => !h);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const onUp = () => setDragging(null);
    window.addEventListener('mouseup', onUp);
    return () => window.removeEventListener('mouseup', onUp);
  }, []);

  const previewCells = useMemo(() => {
    if (!hover) return [];
    const shipId = dragging ? dragging.shipId : selectedShip;
    if (!shipId) return [];
    const ship = SHIPS.find((s) => s.id === shipId);
    if (!ship) return [];

    const offsetIdx = dragging ? dragging.offsetIndex : 0;
    const originRow = horiz ? hover.r : hover.r - offsetIdx;
    const originCol = horiz ? hover.c - offsetIdx : hover.c;

    const boardWithout = playerBoard.map((row) => row.map((v) => (v === shipId ? EMPTY : v)));
    const valid = canPlace(boardWithout, originRow, originCol, ship.size, horiz);

    const cells = [];
    for (let i = 0; i < ship.size; i++) {
      const r = horiz ? originRow : originRow + i;
      const c = horiz ? originCol + i : originCol;
      if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
        cells.push({ r, c, valid });
      }
    }
    return cells;
  }, [hover, dragging, selectedShip, horiz, playerBoard]);

  const dropShip = useCallback(
    (r, c) => {
      const shipId = dragging ? dragging.shipId : selectedShip;
      if (!shipId) {
        setDragging(null);
        return;
      }
      const ship = SHIPS.find((s) => s.id === shipId);
      if (!ship) {
        setDragging(null);
        return;
      }

      const offsetIdx = dragging ? dragging.offsetIndex : 0;
      const originRow = horiz ? r : r - offsetIdx;
      const originCol = horiz ? c - offsetIdx : c;

      const boardWithout = playerBoard.map((row) => row.map((v) => (v === shipId ? EMPTY : v)));
      if (!canPlace(boardWithout, originRow, originCol, ship.size, horiz)) {
        setDragging(null);
        return;
      }

      const nextBoard = placeShipOnBoard(boardWithout, originRow, originCol, ship.size, horiz, shipId);
      setPlayerBoard(nextBoard);

      setPlaced((prev) => {
        const isNew = !prev[shipId];
        const updated = { ...prev, [shipId]: { row: originRow, col: originCol, horiz } };
        if (isNew) {
          const stillUnplaced = SHIPS.find((s) => !updated[s.id]);
          if (stillUnplaced) setSelectedShip(stillUnplaced.id);
        }
        return updated;
      });

      setDragging(null);
    },
    [dragging, selectedShip, horiz, playerBoard]
  );

  const handleCellMouseDown = useCallback(
    (r, c) => {
      const cellShipId = playerBoard[r][c];
      if (cellShipId && cellShipId !== EMPTY) {
        const info = placed[cellShipId];
        if (!info) return;
        const offsetIndex = info.horiz ? c - info.col : r - info.row;
        setDragging({ shipId: cellShipId, offsetIndex });
        setSelectedShip(cellShipId);
        setHoriz(info.horiz);
      }
    },
    [playerBoard, placed]
  );

  const handleCellMouseUp = useCallback(
    (r, c) => {
      if (dragging) {
        dropShip(r, c);
      } else {
        const cellShipId = playerBoard[r][c];
        if (cellShipId && cellShipId !== EMPTY) return;
        if (!selectedShip) return;
        const ship = SHIPS.find((s) => s.id === selectedShip);
        if (!ship) return;
        const boardWithout = playerBoard.map((row) => row.map((v) => (v === selectedShip ? EMPTY : v)));
        if (!canPlace(boardWithout, r, c, ship.size, horiz)) return;
        const nextBoard = placeShipOnBoard(boardWithout, r, c, ship.size, horiz, selectedShip);
        setPlayerBoard(nextBoard);
        setPlaced((prev) => {
          const updated = { ...prev, [selectedShip]: { row: r, col: c, horiz } };
          const stillUnplaced = SHIPS.find((s) => !updated[s.id]);
          if (stillUnplaced) setSelectedShip(stillUnplaced.id);
          return updated;
        });
      }
    },
    [dragging, dropShip, playerBoard, selectedShip, horiz]
  );

  const handleRandomize = () => {
    let board = makeBoard();
    const newPlaced = {};
    for (const ship of SHIPS) {
      let ok = false;
      while (!ok) {
        const h = Math.random() < 0.5;
        const r = Math.floor(Math.random() * BOARD_SIZE);
        const c = Math.floor(Math.random() * BOARD_SIZE);
        if (canPlace(board, r, c, ship.size, h)) {
          board = placeShipOnBoard(board, r, c, ship.size, h, ship.id);
          newPlaced[ship.id] = { row: r, col: c, horiz: h };
          ok = true;
        }
      }
    }
    setPlayerBoard(board);
    setPlaced(newPlaced);
    setDragging(null);
  };

  return (
    <div className="fleet-tactics-setup">
      <div className="fleet-tactics-setup-header">
        <div className="game-menu-top fleet-tactics-top-bar">
          <button type="button" className="btn-back-home" onClick={onExit}>← Back to Games</button>
        </div>
        <div className="namesake-fleet-brand">
          <img src="/brand/archerfish-logo.jpg" alt="Archerfish logo" />
          <div>
            <h1>Archerfish</h1>
            <p>Fleet Tactics · Deploy your fleet</p>
            <a className="namesake-about" href="/about/archerfish/">About the Fish →</a>
          </div>
        </div>
        <p className="fleet-tactics-phase-sub">
          Tap a cell to place · <strong>Drag</strong> placed ships to move · <kbd className="fleet-tactics-kbd">Space</kbd> to rotate
        </p>
      </div>

      <div className="fleet-tactics-setup-body">
        <div className="fleet-tactics-ship-list">
          <div className="fleet-tactics-ship-list-title">Your Fleet</div>
          <div className="fleet-tactics-ships-grid">
            {SHIPS.map((ship) => (
              <button
                key={ship.id}
                type="button"
                className={`fleet-tactics-ship-btn ${selectedShip === ship.id ? 'fleet-tactics-ship-btn-active' : ''} ${placed[ship.id] ? 'fleet-tactics-ship-btn-placed' : ''}`}
                onClick={() => setSelectedShip(ship.id)}
              >
                <span className="fleet-tactics-ship-btn-icon">{ship.icon}</span>
                <span className="fleet-tactics-ship-btn-name">{ship.name}</span>
                <span className="fleet-tactics-ship-btn-size">{ship.size}</span>
                {placed[ship.id] && <span className="fleet-tactics-ship-btn-check">✓</span>}
              </button>
            ))}
          </div>

          <div className="fleet-tactics-setup-controls">
            <button type="button" className="fleet-tactics-orient-btn" onClick={() => setHoriz((h) => !h)}>
              {horiz ? '↔ Horizontal' : '↕ Vertical'}
            </button>
            <button type="button" className="fleet-tactics-randomize-btn" onClick={handleRandomize}>
              🎲 Randomize
            </button>
          </div>
        </div>

        <div className="fleet-tactics-setup-board-wrap">
          <SetupBoard
            shipBoard={playerBoard}
            previewCells={previewCells}
            draggingShipId={dragging ? dragging.shipId : null}
            onCellMouseDown={handleCellMouseDown}
            onCellMouseUp={handleCellMouseUp}
            onCellHover={(r, c) => setHover({ r, c })}
            onBoardLeave={() => {
              setHover(null);
              setDragging(null);
            }}
          />
        </div>
      </div>

      <div className="fleet-tactics-setup-footer">
        <button
          type="button"
          className={`fleet-tactics-start-btn ${allPlaced ? 'fleet-tactics-start-btn-ready' : ''}`}
          disabled={!allPlaced}
          onClick={() => onReady(playerBoard)}
        >
          {allPlaced ? '🚀 Start Battle!' : `Place ${nextUnplaced ? nextUnplaced.name : '...'} first`}
        </button>
      </div>
    </div>
  );
};

// ─── Phase: Battle ────────────────────────────────────────────────────────────

const BattlePhase = ({ playerBoard, settings, onExit, onPlayAgain, onRecordResult }) => {
  const [aiBoard] = useState(() => randomAIBoard());
  const [playerHitBoard, setPlayerHitBoard] = useState(makeBoard());
  const [aiHitBoard, setAiHitBoard] = useState(makeBoard());
  const [turn, setTurn] = useState('player');
  const [winner, setWinner] = useState(null);
  const [log, setLog] = useState([]);
  const [aiMemory, setAiMemory] = useState({ mode: 'hunt', hits: [], queue: [] });
  const [shotsFired, setShotsFired] = useState(0);

  const addLog = (msg) => setLog((prev) => [msg, ...prev].slice(0, 20));

  const handlePlayerFire = useCallback(
    (r, c) => {
      if (turn !== 'player') return;
      if (aiHitBoard[r][c] !== EMPTY) return;

      const isHit = aiBoard[r][c] !== EMPTY;
      const shipId = aiBoard[r][c];
      const newAiHit = aiHitBoard.map((row) => [...row]);
      newAiHit[r][c] = isHit ? HIT : MISS;
      setAiHitBoard(newAiHit);
      setShotsFired((s) => s + 1);

      const coord = `${String.fromCharCode(65 + c)}${r + 1}`;
      let sunkMsg = '';
      if (isHit && shipId) {
        const ship = SHIPS.find((s) => s.id === shipId);
        if (isShipSunk(shipId, aiBoard, newAiHit) && ship) sunkMsg = ` — ${ship.name} sunk! ${ship.icon}`;
      }
      addLog(`You fired at ${coord}: ${isHit ? '💥 HIT' : '🌊 Miss'}${sunkMsg}`);
      playTone(isHit ? 'hit' : 'miss', settings?.soundEnabled);

      if (checkAllSunk(aiBoard, newAiHit)) {
        setWinner('player');
        setTurn('over');
        playTone('win', settings?.soundEnabled);
        onRecordResult?.('archerfish', { won: true });
        return;
      }
      setTurn('ai');
    },
    [turn, aiBoard, aiHitBoard, settings?.soundEnabled, onRecordResult]
  );

  useEffect(() => {
    if (turn !== 'ai') return undefined;
    const timer = setTimeout(() => {
      const { r, c, newMemory } = aiShoot(playerHitBoard, aiMemory);
      const isHit = playerBoard[r][c] !== EMPTY;
      const shipId = playerBoard[r][c];
      const newPlayerHit = playerHitBoard.map((row) => [...row]);
      newPlayerHit[r][c] = isHit ? HIT : MISS;
      setPlayerHitBoard(newPlayerHit);

      const coord = `${String.fromCharCode(65 + c)}${r + 1}`;
      let sunkMsg = '';
      let updatedMemory = isHit ? updateAIMemoryAfterHit(newMemory, r, c, newPlayerHit) : newMemory;
      if (isHit && shipId) {
        const ship = SHIPS.find((s) => s.id === shipId);
        if (isShipSunk(shipId, playerBoard, newPlayerHit) && ship) {
          sunkMsg = ` — your ${ship.name} is sunk! ${ship.icon}`;
          updatedMemory = { mode: 'hunt', hits: [], queue: [] };
        }
      }
      setAiMemory(updatedMemory);
      addLog(`Enemy fired at ${coord}: ${isHit ? '💥 HIT' : '🌊 Miss'}${sunkMsg}`);

      if (checkAllSunk(playerBoard, newPlayerHit)) {
        setWinner('ai');
        setTurn('over');
        playTone('lose', settings?.soundEnabled);
        onRecordResult?.('archerfish', { won: false });
        return;
      }
      setTurn('player');
    }, 650);
    return () => clearTimeout(timer);
  }, [turn, playerHitBoard, aiMemory, playerBoard, settings?.soundEnabled, onRecordResult]);

  const playerSunk = SHIPS.filter((s) => isShipSunk(s.id, playerBoard, playerHitBoard));
  const aiSunk = SHIPS.filter((s) => isShipSunk(s.id, aiBoard, aiHitBoard));

  return (
    <div className="fleet-tactics-battle">
      <ConfettiBurst active={winner === 'player'} reducedMotion={settings?.reducedMotion} />

      <div className="fleet-tactics-battle-header">
        <button type="button" className="btn-exit" onClick={onExit}>← Exit</button>
        <div className="fleet-tactics-battle-title">⚓ <span>Archerfish · Fleet Tactics</span></div>
        <div className={`fleet-tactics-turn-badge ${turn === 'player' ? 'fleet-tactics-turn-you' : turn === 'ai' ? 'fleet-tactics-turn-ai' : 'fleet-tactics-turn-over'}`}>
          {turn === 'player' ? '🎯 Your Turn' : turn === 'ai' ? '🤖 AI Thinking…' : winner === 'player' ? '🏆 Victory!' : '💀 Defeated'}
        </div>
      </div>

      <div className="fleet-tactics-battle-main">
        <div className="fleet-tactics-board-section">
          <div className="fleet-tactics-board-label">Enemy Waters — click to fire!</div>
          <BattleBoard
            shipBoard={aiBoard}
            hitBoard={aiHitBoard}
            isEnemy
            onCellClick={handlePlayerFire}
            disabled={turn !== 'player'}
          />
          <div className="fleet-tactics-sunk-list" title="Enemy fleet remaining">
            {SHIPS.map((s) => (
              <span key={s.id} className={`fleet-tactics-sunk-ship ${aiSunk.some((ss) => ss.id === s.id) ? 'fleet-tactics-sunk-ship-done' : ''}`}>
                {s.icon}
              </span>
            ))}
          </div>
        </div>

        <div className="fleet-tactics-log-panel">
          <div className="fleet-tactics-log-title">📡 Battle Log</div>
          <div className="fleet-tactics-log-scroll">
            {log.length === 0 ? (
              <div className="empty-state-compact">
                <p className="empty-state-compact-desc">
                  Radar log records every salvo, hit confirmation, and sunken ship.
                </p>
                <button
                  type="button"
                  className="empty-state-mini-btn"
                  disabled={turn !== 'player'}
                  onClick={() => handlePlayerFire(4, 4)}
                >
                  🎯 Fire Recon Salvo (E5)
                </button>
                <div className="empty-state-sample-line">
                  Sample: <code>You fired at E5: 💥 HIT</code>
                </div>
              </div>
            ) : (
              log.map((entry, i) => (
                <div key={i} className={`fleet-tactics-log-entry ${i === 0 ? 'fleet-tactics-log-entry-new' : ''}`}>
                  {entry}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="fleet-tactics-board-section">
          <div className="fleet-tactics-board-label">Your Waters — defend!</div>
          <BattleBoard shipBoard={playerBoard} hitBoard={playerHitBoard} isEnemy={false} disabled />
          <div className="fleet-tactics-sunk-list" title="Your fleet remaining">
            {SHIPS.map((s) => (
              <span key={s.id} className={`fleet-tactics-sunk-ship ${playerSunk.some((ss) => ss.id === s.id) ? 'fleet-tactics-sunk-ship-done' : ''}`}>
                {s.icon}
              </span>
            ))}
          </div>
        </div>
      </div>

      {turn === 'over' && (
        <div className="smm-overlay">
          <div className="overlay-card smm-overlay-card">
            <div className="overlay-icon">{winner === 'player' ? '🏆' : '💀'}</div>
            <h2>{winner === 'player' ? 'Victory!' : 'Defeated!'}</h2>
            <p>
              {winner === 'player'
                ? `You sank the entire enemy fleet in ${shotsFired} salvos!`
                : `The enemy sank your fleet after ${shotsFired} player salvos.`}
            </p>
            <ShareResultButton
              title="🐟 Archerfish · Fleet Tactics"
              summary={
                winner === 'player'
                  ? `Victory! Sank all 5 enemy ships in ${shotsFired} salvos.`
                  : `Fought a ${shotsFired}-salvo naval duel and sank ${aiSunk.length}/5 enemy ships.`
              }
              urlHash="archerfish"
            />
            <div className="overlay-actions">
              <button type="button" className="btn-primary" onClick={onPlayAgain}>New Deployment</button>
              <button type="button" className="btn-secondary" onClick={onExit}>Back to Menu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Root ─────────────────────────────────────────────────────────────────────

const Archerfish = ({ settings, onExit, onRecordResult }) => {
  const [phase, setPhase] = useState('setup');
  const [playerBoard, setPlayerBoard] = useState(null);

  if (phase === 'setup') {
    return (
      <SetupPhase
        onReady={(board) => {
          setPlayerBoard(board);
          setPhase('battle');
        }}
        onExit={onExit}
      />
    );
  }
  return (
    <BattlePhase
      playerBoard={playerBoard}
      settings={settings}
      onExit={onExit}
      onPlayAgain={() => {
        setPlayerBoard(null);
        setPhase('setup');
      }}
      onRecordResult={onRecordResult}
    />
  );
};

export default Archerfish;
