import { useState, useCallback, useEffect, useMemo } from 'react';

// ─── Constants ───────────────────────────────────────────────────────────────

const BOARD_SIZE = 10;
const EMPTY = 0;
const HIT   = 2;
const MISS  = 3;

const SHIPS = [
  { id: 'carrier',    name: 'Carrier',    size: 5, icon: '🛸' },
  { id: 'battleship', name: 'Battleship', size: 4, icon: '⚓' },
  { id: 'cruiser',    name: 'Cruiser',    size: 3, icon: '🚢' },
  { id: 'submarine',  name: 'Submarine',  size: 3, icon: '🤿' },
  { id: 'destroyer',  name: 'Destroyer',  size: 2, icon: '⚡' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const makeBoard = () => Array(BOARD_SIZE).fill(0).map(() => Array(BOARD_SIZE).fill(EMPTY));

const canPlace = (board, row, col, size, horiz) => {
  for (let i = 0; i < size; i++) {
    const r = horiz ? row     : row + i;
    const c = horiz ? col + i : col;
    if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) return false;
    if (board[r][c] !== EMPTY) return false;
  }
  return true;
};

const placeShipOnBoard = (board, row, col, size, horiz, shipId) => {
  const next = board.map(r => [...r]);
  for (let i = 0; i < size; i++) {
    const r = horiz ? row     : row + i;
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
      const row   = Math.floor(Math.random() * BOARD_SIZE);
      const col   = Math.floor(Math.random() * BOARD_SIZE);
      if (canPlace(board, row, col, ship.size, horiz)) {
        board = placeShipOnBoard(board, row, col, ship.size, horiz, ship.id);
        placed = true;
      }
    }
  }
  return board;
};

const checkAllSunk = (shipBoard, hitBoard) => {
  for (let r = 0; r < BOARD_SIZE; r++)
    for (let c = 0; c < BOARD_SIZE; c++)
      if (shipBoard[r][c] !== EMPTY && hitBoard[r][c] !== HIT)
        return false;
  return true;
};

const isShipSunk = (shipId, shipBoard, hitBoard) => {
  for (let r = 0; r < BOARD_SIZE; r++)
    for (let c = 0; c < BOARD_SIZE; c++)
      if (shipBoard[r][c] === shipId && hitBoard[r][c] !== HIT)
        return false;
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

  let r, c, tries = 0;
  do {
    r = Math.floor(Math.random() * BOARD_SIZE);
    c = Math.floor(Math.random() * BOARD_SIZE);
    tries++;
  } while (already(r, c) && tries < 200);

  return { r, c, newMemory: { mode: 'hunt', hits: [], queue: [] } };
};

const updateAIMemoryAfterHit = (memory, r, c, hitBoard) => {
  const hits = [...memory.hits, [r, c]];
  const dirs = [[0,1],[0,-1],[1,0],[-1,0]];
  const candidates = [];
  for (const [dr, dc] of dirs) {
    const nr = r + dr, nc = c + dc;
    if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && hitBoard[nr][nc] === EMPTY)
      candidates.push([nr, nc]);
  }
  const existingStr = new Set(memory.queue.map(([a,b]) => `${a},${b}`));
  const queue = [...memory.queue, ...candidates.filter(([a,b]) => !existingStr.has(`${a},${b}`))];
  return { mode: 'target', hits, queue };
};

// ─── Setup Board Cell ─────────────────────────────────────────────────────────

const SetupCell = ({ shipId, preview, previewValid, isDragging, onMouseDown, onMouseUp, onMouseEnter }) => {
  let cls = 'bs-cell';

  if (preview) {
    cls += previewValid ? ' bs-cell-preview-valid' : ' bs-cell-preview-invalid';
  } else if (shipId) {
    cls += ' bs-cell-ship';
    cls += isDragging ? ' bs-cell-ship-dragging' : ' bs-cell-ship-grabbable';
  } else {
    cls += ' bs-cell-water';
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

const SetupBoard = ({ shipBoard, previewCells, draggingShipId, onCellMouseDown, onCellMouseUp, onCellHover, onBoardLeave }) => {
  return (
    <div
      className="bs-board"
      onMouseLeave={onBoardLeave}
    >
      <div className="bs-label-row">
        <div className="bs-label-corner" />
        {Array.from({ length: BOARD_SIZE }, (_, i) => (
          <div key={i} className="bs-label-cell">{String.fromCharCode(65 + i)}</div>
        ))}
      </div>
      {Array.from({ length: BOARD_SIZE }, (_, r) => (
        <div key={r} className="bs-row">
          <div className="bs-label-cell">{r + 1}</div>
          {Array.from({ length: BOARD_SIZE }, (_, c) => {
            const shipId  = shipBoard[r][c] || null;
            const prev    = previewCells.find(p => p.r === r && p.c === c);
            return (
              <SetupCell
                key={c}
                shipId={prev ? null : shipId}   // hide ship under preview
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
};

// ─── Battle Board Cell ────────────────────────────────────────────────────────

const BattleCell = ({ state, shipId, isEnemy, isSunk, onClick, onMouseEnter }) => {
  let cls = 'bs-cell';
  if (isEnemy) {
    cls += ' bs-cell-enemy';
    if (state === MISS) cls += ' bs-cell-miss';
    else if (state === HIT) cls += isSunk ? ' bs-cell-sunk' : ' bs-cell-hit';
    else cls += ' bs-cell-unknown';
  } else {
    if (state === MISS) cls += ' bs-cell-miss';
    else if (state === HIT) cls += isSunk ? ' bs-cell-sunk' : ' bs-cell-hit';
    else if (shipId) cls += isSunk ? ' bs-cell-ship bs-cell-sunk' : ' bs-cell-ship';
    else cls += ' bs-cell-water';
  }
  return (
    <div
      className={cls}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
    />
  );
};

const BattleBoard = ({ shipBoard, hitBoard, isEnemy, onCellClick, disabled }) => (
  <div className="bs-board">
    <div className="bs-label-row">
      <div className="bs-label-corner" />
      {Array.from({ length: BOARD_SIZE }, (_, i) => (
        <div key={i} className="bs-label-cell">{String.fromCharCode(65 + i)}</div>
      ))}
    </div>
    {Array.from({ length: BOARD_SIZE }, (_, r) => (
      <div key={r} className="bs-row">
        <div className="bs-label-cell">{r + 1}</div>
        {Array.from({ length: BOARD_SIZE }, (_, c) => {
          const shipId = shipBoard ? shipBoard[r][c] : null;
          const state  = hitBoard  ? hitBoard[r][c]  : EMPTY;
          const sunk   = shipId && hitBoard ? isShipSunk(shipId, shipBoard, hitBoard) : false;
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
  const [placed, setPlaced]           = useState({});     // shipId -> { row, col, horiz }
  const [selectedShip, setSelectedShip] = useState(SHIPS[0].id);
  const [horiz, setHoriz]             = useState(true);
  const [hover, setHover]             = useState(null);   // { r, c } | null
  // dragging: { shipId, offsetIndex } — which ship is held and where on it was grabbed
  const [dragging, setDragging]       = useState(null);

  const allPlaced    = SHIPS.every(s => placed[s.id]);
  const nextUnplaced = SHIPS.find(s => !placed[s.id]);

  // ── Spacebar → rotate ────────────────────────────────────────────
  useEffect(() => {
    const onKey = e => { if (e.code === 'Space') { e.preventDefault(); setHoriz(h => !h); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // ── Cancel drag if mouse released anywhere outside the board ─────
  useEffect(() => {
    const onUp = () => setDragging(null);
    window.addEventListener('mouseup', onUp);
    return () => window.removeEventListener('mouseup', onUp);
  }, []);

  // ── Compute preview cells ────────────────────────────────────────
  const previewCells = useMemo(() => {
    if (!hover) return [];
    const shipId = dragging ? dragging.shipId : selectedShip;
    if (!shipId) return [];
    const ship = SHIPS.find(s => s.id === shipId);
    if (!ship) return [];

    // How far into the ship the cursor grabbed (0 if placing fresh from sidebar)
    const offsetIdx = dragging ? dragging.offsetIndex : 0;

    // Ship origin accounting for the grab offset
    const originRow = horiz ? hover.r           : hover.r - offsetIdx;
    const originCol = horiz ? hover.c - offsetIdx : hover.c;

    // Validate against the board with this ship temporarily removed
    const boardWithout = playerBoard.map(row => row.map(v => v === shipId ? EMPTY : v));
    const valid = canPlace(boardWithout, originRow, originCol, ship.size, horiz);

    const cells = [];
    for (let i = 0; i < ship.size; i++) {
      const r = horiz ? originRow     : originRow + i;
      const c = horiz ? originCol + i : originCol;
      if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE)
        cells.push({ r, c, valid });
    }
    return cells;
  }, [hover, dragging, selectedShip, horiz, playerBoard]);

  // ── Drop a ship at the hovered cell ─────────────────────────────
  const dropShip = useCallback((r, c) => {
    const shipId   = dragging ? dragging.shipId : selectedShip;
    if (!shipId) { setDragging(null); return; }
    const ship     = SHIPS.find(s => s.id === shipId);
    if (!ship)   { setDragging(null); return; }

    const offsetIdx = dragging ? dragging.offsetIndex : 0;
    const originRow = horiz ? r           : r - offsetIdx;
    const originCol = horiz ? c - offsetIdx : c;

    const boardWithout = playerBoard.map(row => row.map(v => v === shipId ? EMPTY : v));
    if (!canPlace(boardWithout, originRow, originCol, ship.size, horiz)) {
      setDragging(null);
      return;
    }

    const nextBoard = placeShipOnBoard(boardWithout, originRow, originCol, ship.size, horiz, shipId);
    setPlayerBoard(nextBoard);

    setPlaced(prev => {
      const isNew   = !prev[shipId];
      const updated = { ...prev, [shipId]: { row: originRow, col: originCol, horiz } };
      // Auto-advance to next unplaced only when it's a brand-new placement
      if (isNew) {
        const stillUnplaced = SHIPS.find(s => !updated[s.id]);
        if (stillUnplaced) setSelectedShip(stillUnplaced.id);
      }
      return updated;
    });

    setDragging(null);
  }, [dragging, selectedShip, horiz, playerBoard]);

  // ── Cell mouse down: pick up an existing ship, or ignore (let up handle fresh place) ─
  const handleCellMouseDown = useCallback((r, c) => {
    const cellShipId = playerBoard[r][c];
    if (cellShipId && cellShipId !== EMPTY) {
      // Pick up a placed ship — compute which segment was grabbed
      const info = placed[cellShipId];
      if (!info) return;
      const offsetIndex = info.horiz ? c - info.col : r - info.row;
      setDragging({ shipId: cellShipId, offsetIndex });
      setSelectedShip(cellShipId);
      setHoriz(info.horiz);
    }
    // Empty cell: do nothing on mousedown — placement happens on mouseup
  }, [playerBoard, placed]);

  // ── Cell mouse up: complete drop or fresh placement ──────────────
  const handleCellMouseUp = useCallback((r, c) => {
    if (dragging) {
      // Complete the drag
      dropShip(r, c);
    } else {
      // Fresh click on empty cell → place the selected ship at that cell (origin)
      const cellShipId = playerBoard[r][c];
      if (cellShipId && cellShipId !== EMPTY) return; // clicked on a ship without dragging — ignore
      if (!selectedShip) return;
      const ship = SHIPS.find(s => s.id === selectedShip);
      if (!ship) return;
      const boardWithout = playerBoard.map(row => row.map(v => v === selectedShip ? EMPTY : v));
      if (!canPlace(boardWithout, r, c, ship.size, horiz)) return;
      const nextBoard = placeShipOnBoard(boardWithout, r, c, ship.size, horiz, selectedShip);
      setPlayerBoard(nextBoard);
      setPlaced(prev => {
        const updated = { ...prev, [selectedShip]: { row: r, col: c, horiz } };
        const stillUnplaced = SHIPS.find(s => !updated[s.id]);
        if (stillUnplaced) setSelectedShip(stillUnplaced.id);
        return updated;
      });
    }
  }, [dragging, dropShip, playerBoard, selectedShip, horiz]);

  // ── Randomize ────────────────────────────────────────────────────
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
    <div className="bs-setup" style={{ position: 'relative' }}>
      <div style={{ width: '100%', padding: '1rem', position: 'absolute', top: 0, left: 0, zIndex: 10 }}>
        <button className="btn-exit" onClick={onExit}>← Exit</button>
      </div>
      <div className="bs-setup-header">
        <h2 className="bs-phase-title">⚓ Deploy Your Fleet</h2>
        <p className="bs-phase-sub">
          Click an empty cell to place · <strong>Drag</strong> placed ships to reposition · <kbd className="bs-kbd">Space</kbd> to rotate
        </p>
      </div>

      <div className="bs-setup-body">
        {/* Ship list sidebar */}
        <div className="bs-ship-list">
          <div className="bs-ship-list-title">Your Fleet</div>
          {SHIPS.map(ship => (
            <button
              key={ship.id}
              className={`bs-ship-btn ${selectedShip === ship.id ? 'bs-ship-btn-active' : ''} ${placed[ship.id] ? 'bs-ship-btn-placed' : ''}`}
              onClick={() => setSelectedShip(ship.id)}
            >
              <span className="bs-ship-btn-icon">{ship.icon}</span>
              <span className="bs-ship-btn-name">{ship.name}</span>
              <span className="bs-ship-btn-size">{ship.size}</span>
              {placed[ship.id] && <span className="bs-ship-btn-check">✓</span>}
            </button>
          ))}

          <div className="bs-setup-controls">
            <button className="bs-orient-btn" onClick={() => setHoriz(h => !h)}>
              {horiz ? '↔ Horizontal' : '↕ Vertical'}
            </button>
            <button className="bs-randomize-btn" onClick={handleRandomize}>🎲 Random</button>
          </div>
        </div>

        {/* Board */}
        <div className="bs-setup-board-wrap">
          <SetupBoard
            shipBoard={playerBoard}
            previewCells={previewCells}
            draggingShipId={dragging ? dragging.shipId : null}
            onCellMouseDown={handleCellMouseDown}
            onCellMouseUp={handleCellMouseUp}
            onCellHover={(r, c) => setHover({ r, c })}
            onBoardLeave={() => { setHover(null); setDragging(null); }}
          />
        </div>
      </div>

      <div className="bs-setup-footer">
        <button
          className={`bs-start-btn ${allPlaced ? 'bs-start-btn-ready' : ''}`}
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

const BattlePhase = ({ playerBoard, onExit }) => {
  const [aiBoard]          = useState(() => randomAIBoard());
  const [playerHitBoard, setPlayerHitBoard] = useState(makeBoard());
  const [aiHitBoard,     setAiHitBoard]     = useState(makeBoard());
  const [turn,           setTurn]           = useState('player');
  const [winner,         setWinner]         = useState(null);
  const [log,            setLog]            = useState([]);
  const [aiMemory,       setAiMemory]       = useState({ mode: 'hunt', hits: [], queue: [] });

  const addLog = msg => setLog(prev => [msg, ...prev].slice(0, 20));

  const handlePlayerFire = useCallback((r, c) => {
    if (turn !== 'player') return;
    if (aiHitBoard[r][c] !== EMPTY) return;

    const isHit  = aiBoard[r][c] !== EMPTY;
    const shipId = aiBoard[r][c];
    const newAiHit = aiHitBoard.map(row => [...row]);
    newAiHit[r][c] = isHit ? HIT : MISS;
    setAiHitBoard(newAiHit);

    const coord = `${String.fromCharCode(65 + c)}${r + 1}`;
    let sunkMsg = '';
    if (isHit && shipId) {
      const ship = SHIPS.find(s => s.id === shipId);
      if (isShipSunk(shipId, aiBoard, newAiHit) && ship) sunkMsg = ` — ${ship.name} sunk! ${ship.icon}`;
    }
    addLog(`You fired at ${coord}: ${isHit ? '💥 HIT' : '🌊 Miss'}${sunkMsg}`);

    if (checkAllSunk(aiBoard, newAiHit)) { setWinner('player'); setTurn('over'); return; }
    setTurn('ai');
  }, [turn, aiBoard, aiHitBoard]);

  useEffect(() => {
    if (turn !== 'ai') return;
    const timer = setTimeout(() => {
      const { r, c, newMemory } = aiShoot(playerHitBoard, aiMemory);
      const isHit  = playerBoard[r][c] !== EMPTY;
      const shipId = playerBoard[r][c];
      const newPlayerHit = playerHitBoard.map(row => [...row]);
      newPlayerHit[r][c] = isHit ? HIT : MISS;
      setPlayerHitBoard(newPlayerHit);

      const coord = `${String.fromCharCode(65 + c)}${r + 1}`;
      let sunkMsg = '';
      let updatedMemory = isHit ? updateAIMemoryAfterHit(newMemory, r, c, newPlayerHit) : newMemory;
      if (isHit && shipId) {
        const ship = SHIPS.find(s => s.id === shipId);
        if (isShipSunk(shipId, playerBoard, newPlayerHit) && ship) {
          sunkMsg = ` — your ${ship.name} is sunk! ${ship.icon}`;
          updatedMemory = { mode: 'hunt', hits: [], queue: [] };
        }
      }
      setAiMemory(updatedMemory);
      addLog(`Enemy fired at ${coord}: ${isHit ? '💥 HIT' : '🌊 Miss'}${sunkMsg}`);

      if (checkAllSunk(playerBoard, newPlayerHit)) { setWinner('ai'); setTurn('over'); return; }
      setTurn('player');
    }, 800);
    return () => clearTimeout(timer);
  }, [turn, playerHitBoard, aiMemory, playerBoard]);

  const playerSunk = SHIPS.filter(s => isShipSunk(s.id, playerBoard, playerHitBoard));
  const aiSunk     = SHIPS.filter(s => isShipSunk(s.id, aiBoard, aiHitBoard));

  return (
    <div className="bs-battle">
      <div className="bs-battle-header">
        <button className="btn-exit" onClick={onExit}>← Exit</button>
        <div className="bs-battle-title">⚓ <span>Battleship</span></div>
        <div className={`bs-turn-badge ${turn === 'player' ? 'bs-turn-you' : turn === 'ai' ? 'bs-turn-ai' : 'bs-turn-over'}`}>
          {turn === 'player' ? '🎯 Your Turn' : turn === 'ai' ? '🤖 AI Thinking…' : winner === 'player' ? '🏆 Victory!' : '💀 Defeated'}
        </div>
      </div>

      <div className="bs-battle-main">
        <div className="bs-board-section">
          <div className="bs-board-label">Enemy Waters — click to fire!</div>
          <BattleBoard
            shipBoard={aiBoard}
            hitBoard={aiHitBoard}
            isEnemy={true}
            onCellClick={handlePlayerFire}
            disabled={turn !== 'player'}
          />
          <div className="bs-sunk-list">
            {SHIPS.map(s => (
              <span key={s.id} className={`bs-sunk-ship ${aiSunk.some(ss => ss.id === s.id) ? 'bs-sunk-ship-done' : ''}`}>
                {s.icon}
              </span>
            ))}
          </div>
        </div>

        <div className="bs-log-panel">
          <div className="bs-log-title">📡 Battle Log</div>
          <div className="bs-log-scroll">
            {log.map((entry, i) => (
              <div key={i} className={`bs-log-entry ${i === 0 ? 'bs-log-entry-new' : ''}`}>{entry}</div>
            ))}
          </div>
        </div>

        <div className="bs-board-section">
          <div className="bs-board-label">Your Waters — defend!</div>
          <BattleBoard
            shipBoard={playerBoard}
            hitBoard={playerHitBoard}
            isEnemy={false}
            disabled={true}
          />
          <div className="bs-sunk-list">
            {SHIPS.map(s => (
              <span key={s.id} className={`bs-sunk-ship ${playerSunk.some(ss => ss.id === s.id) ? 'bs-sunk-ship-done' : ''}`}>
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
            <p>{winner === 'player' ? 'You sank the entire enemy fleet!' : 'The enemy sank your entire fleet!'}</p>
            <div className="overlay-actions">
              <button className="btn-primary" onClick={onExit}>Back to Menu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Root ─────────────────────────────────────────────────────────────────────

const Battleship = ({ onExit }) => {
  const [phase, setPhase]             = useState('setup');
  const [playerBoard, setPlayerBoard] = useState(null);

  if (phase === 'setup') {
    return <SetupPhase onReady={board => { setPlayerBoard(board); setPhase('battle'); }} onExit={onExit} />;
  }
  return <BattlePhase playerBoard={playerBoard} onExit={onExit} />;
};

export default Battleship;
