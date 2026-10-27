import { useState, useCallback, useEffect, useRef } from 'react';

// ─── Constants ────────────────────────────────────────────────────────────────

const ROWS = 6;
const COLS = 7;
const EMPTY = 0;
const HUMAN = 1;
const AI    = 2;
const AI_DEPTH = 5; // minimax search depth

const TAUNTS = [
  'IS THAT ALL YOU\'VE GOT?',
  'TOO EASY. 😴',
  'MAYBE TRY CHECKERS.',
  'PREDICTED THAT 4 MOVES AGO.',
  'COME BACK WHEN YOU\'VE PRACTISED.',
  'I WASN\'T EVEN TRYING.',
  'DID YOU MEAN TO DO THAT?',
  'BETTER LUCK NEXT TIME... OR NOT.',
  'MY ALGORITHM IS EMBARRASSED FOR YOU.',
  'YOU PLAYED YOURSELF.',
  'RESISTANCE IS FUTILE.',
  'THAT WAS PAINFUL TO WATCH.',
  'SHOULD I GIVE YOU A HINT NEXT TIME?',
];

// ─── Board Helpers ────────────────────────────────────────────────────────────

function emptyBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(EMPTY));
}

function cloneBoard(board) {
  return board.map(r => [...r]);
}

function dropDisc(board, col, player) {
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r][col] === EMPTY) {
      const next = cloneBoard(board);
      next[r][col] = player;
      return { board: next, row: r };
    }
  }
  return null; // column full
}

function colFull(board, col) {
  return board[0][col] !== EMPTY;
}

function validCols(board) {
  return Array.from({ length: COLS }, (_, c) => c).filter(c => !colFull(board, c));
}

// Returns array of {r,c} for the winning four, or null
function findWin(board) {
  const dirs = [[0,1],[1,0],[1,1],[1,-1]];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const p = board[r][c];
      if (p === EMPTY) continue;
      for (const [dr, dc] of dirs) {
        let cells = [{r,c}];
        for (let k = 1; k < 4; k++) {
          const nr = r + dr * k, nc = c + dc * k;
          if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS || board[nr][nc] !== p) break;
          cells.push({ r: nr, c: nc });
        }
        if (cells.length === 4) return { player: p, cells };
      }
    }
  }
  return null;
}

function isDraw(board) {
  return board[0].every(cell => cell !== EMPTY);
}

// ─── AI (Minimax + alpha-beta) ────────────────────────────────────────────────

function scoreWindow(window) {
  const aiCount    = window.filter(x => x === AI).length;
  const humanCount = window.filter(x => x === HUMAN).length;
  const empty      = window.filter(x => x === EMPTY).length;

  if (aiCount === 4) return 100000;
  if (humanCount === 4) return -100000;
  if (aiCount === 3 && empty === 1) return 50;
  if (aiCount === 2 && empty === 2) return 10;
  if (humanCount === 3 && empty === 1) return -80;
  if (humanCount === 2 && empty === 2) return -10;
  return 0;
}

function scoreBoard(board) {
  let score = 0;
  // Centre column bonus
  const centre = board.map(r => r[Math.floor(COLS / 2)]);
  score += centre.filter(x => x === AI).length * 3;

  // Horizontal
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      score += scoreWindow([board[r][c], board[r][c+1], board[r][c+2], board[r][c+3]]);
    }
  }
  // Vertical
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r <= ROWS - 4; r++) {
      score += scoreWindow([board[r][c], board[r+1][c], board[r+2][c], board[r+3][c]]);
    }
  }
  // Diagonals
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      score += scoreWindow([board[r][c], board[r+1][c+1], board[r+2][c+2], board[r+3][c+3]]);
    }
  }
  for (let r = 3; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      score += scoreWindow([board[r][c], board[r-1][c+1], board[r-2][c+2], board[r-3][c+3]]);
    }
  }
  return score;
}

function minimax(board, depth, alpha, beta, maximising) {
  const win = findWin(board);
  if (win) return win.player === AI ? 100000 + depth : -(100000 + depth);
  if (isDraw(board) || depth === 0) return scoreBoard(board);

  const cols = validCols(board);
  if (maximising) {
    let best = -Infinity;
    for (const col of cols) {
      const res = dropDisc(board, col, AI);
      best = Math.max(best, minimax(res.board, depth - 1, alpha, beta, false));
      alpha = Math.max(alpha, best);
      if (alpha >= beta) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const col of cols) {
      const res = dropDisc(board, col, HUMAN);
      best = Math.min(best, minimax(res.board, depth - 1, alpha, beta, true));
      beta = Math.min(beta, best);
      if (alpha >= beta) break;
    }
    return best;
  }
}

function bestAIMove(board) {
  const cols = validCols(board);
  let best = -Infinity, bestCol = cols[Math.floor(cols.length / 2)];
  for (const col of cols) {
    const res = dropDisc(board, col, AI);
    const score = minimax(res.board, AI_DEPTH - 1, -Infinity, Infinity, false);
    if (score > best) { best = score; bestCol = col; }
  }
  return bestCol;
}

// ─── Component ────────────────────────────────────────────────────────────────

const ClownTriggerfish = ({ onExit }) => {
  const [board,    setBoard]    = useState(() => emptyBoard());
  const [turn,     setTurn]     = useState(HUMAN);
  const [phase,    setPhase]    = useState('playing');
  const [winner,   setWinner]   = useState(null);
  const [hoverCol, setHoverCol] = useState(null);
  const [dropping, setDropping] = useState(null);
  const [taunt,    setTaunt]    = useState(null);
  const aiThinkRef = useRef(false);

  // After every AI turn, compute + play AI move
  useEffect(() => {
    if (turn !== AI || phase !== 'playing' || aiThinkRef.current) return;
    aiThinkRef.current = true;

    // Small delay so the UI feels responsive
    const t = setTimeout(() => {
      setBoard(prev => {
        const col = bestAIMove(prev);
        const result = dropDisc(prev, col, AI);
        if (!result) { aiThinkRef.current = false; return prev; }

        setDropping({ col, row: result.row, player: AI });

        setTimeout(() => {
          setDropping(null);
          setBoard(result.board);

          const win = findWin(result.board);
          if (win) {
            setWinner(win);
            setPhase('win');
            if (win.player === AI) {
              const t = TAUNTS[Math.floor(Math.random() * TAUNTS.length)];
              setTimeout(() => setTaunt(t), 500);
            }
          }
          else if (isDraw(result.board)) { setPhase('draw'); }
          else { setTurn(HUMAN); }

          aiThinkRef.current = false;
        }, 350);

        return prev; // board updates after animation
      });
    }, 400);

    return () => clearTimeout(t);
  }, [turn, phase]);

  const handleColClick = useCallback((col) => {
    if (turn !== HUMAN || phase !== 'playing' || colFull(board, col)) return;

    const result = dropDisc(board, col, HUMAN);
    if (!result) return;

    setDropping({ col, row: result.row, player: HUMAN });

    setTimeout(() => {
      setDropping(null);
      setBoard(result.board);

      const win = findWin(result.board);
      if (win) { setWinner(win); setPhase('win'); }
      else if (isDraw(result.board)) { setPhase('draw'); }
      else { setTurn(AI); }
    }, 350);
  }, [turn, phase, board]);

  const restart = useCallback(() => {
    setBoard(emptyBoard());
    setTurn(HUMAN);
    setPhase('playing');
    setWinner(null);
    setHoverCol(null);
    setDropping(null);
    setTaunt(null);
    aiThinkRef.current = false;
  }, []);

  const winSet = winner
    ? new Set(winner.cells.map(({ r, c }) => `${r}-${c}`))
    : new Set();

  const previewRow = hoverCol !== null && turn === HUMAN && phase === 'playing' && !colFull(board, hoverCol)
    ? (() => {
        for (let r = ROWS - 1; r >= 0; r--) {
          if (board[r][hoverCol] === EMPTY) return r;
        }
        return -1;
      })()
    : -1;

  return (
    <div className="c4-root">
      <div className="clown-brand"><img src="/brand/clown-triggerfish-logo.jpg" alt="Clown Triggerfish logo" /><div><h2>Clown Triggerfish</h2><a className="namesake-about" href="/about/clown-triggerfish/">About the Fish →</a></div></div>
      {/* ── Header ── */}
      <div className="c4-header">
        <button className="btn-exit" onClick={onExit}>← Exit</button>
        <h1 className="c4-title">Four in a Row</h1>
        <div className="c4-turn-badge">
          {phase === 'playing' && (
            turn === HUMAN
              ? <span className="c4-badge c4-badge-human">🔴 Your Turn</span>
              : <span className="c4-badge c4-badge-ai">🔵 AI Thinking…</span>
          )}
          {phase === 'win' && (
            winner.player === HUMAN
              ? <span className="c4-badge c4-badge-human">🎉 You Win!</span>
              : <span className="c4-badge c4-badge-ai">🤖 AI Wins!</span>
          )}
          {phase === 'draw' && <span className="c4-badge c4-badge-draw">🤝 Draw!</span>}
        </div>
      </div>

      {/* ── Drop indicator strip ── */}
      <div className="c4-indicator-row">
        {Array.from({ length: COLS }, (_, c) => (
          <div key={c} className="c4-indicator-cell">
            {hoverCol === c && turn === HUMAN && phase === 'playing' && !colFull(board, c) && (
              <div className="c4-indicator-disc c4-disc-human" />
            )}
          </div>
        ))}
      </div>

      {/* ── Board ── */}
      <div
        className="c4-board"
        onMouseLeave={() => setHoverCol(null)}
      >
        {/* Column click zones */}
        <div className="c4-col-zones">
          {Array.from({ length: COLS }, (_, c) => (
            <div
              key={c}
              className="c4-col-zone"
              onMouseEnter={() => setHoverCol(c)}
              onClick={() => handleColClick(c)}
            />
          ))}
        </div>

        {/* Grid */}
        {Array.from({ length: ROWS }, (_, r) => (
          <div key={r} className="c4-row">
            {Array.from({ length: COLS }, (_, c) => {
              const cell     = board[r][c];
              const isWin    = winSet.has(`${r}-${c}`);
              const isPreview = previewRow === r && hoverCol === c;
              const isDrop   = dropping && dropping.col === c && dropping.row === r;

              let discCls = 'c4-disc c4-disc-empty';
              if (cell === HUMAN) discCls = `c4-disc c4-disc-human ${isWin ? 'c4-disc-win' : ''}`;
              if (cell === AI)    discCls = `c4-disc c4-disc-ai    ${isWin ? 'c4-disc-win' : ''}`;
              if (isDrop)        discCls += ' c4-disc-drop';
              if (isPreview && cell === EMPTY) discCls = 'c4-disc c4-disc-preview';

              return (
                <div key={c} className="c4-cell">
                  <div className={discCls} />
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* ── Play Again / Restart ── */}
      {(phase === 'win' || phase === 'draw') && (
        <div className="c4-end-actions">
          <button className="c4-btn-play-again" onClick={restart}>
            Play Again
          </button>
        </div>
      )}
      {phase === 'playing' && (
        <div className="c4-end-actions">
          <button className="c4-btn-restart" onClick={restart}>
            ↺ Restart
          </button>
        </div>
      )}
      {/* ── Taunt overlay ── */}
      {taunt && (
        <div className="c4-taunt-overlay" onClick={() => setTaunt(null)}>
          <div className="c4-taunt-text">{taunt}</div>
          <div className="c4-taunt-sub">click to dismiss</div>
        </div>
      )}
    </div>
  );
};

export default ClownTriggerfish;
