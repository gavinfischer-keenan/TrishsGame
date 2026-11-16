import { useState, useCallback, useEffect, useRef } from 'react';
import ConfettiBurst from '../../components/ConfettiBurst';
import ShareResultButton from '../../components/ShareResultButton';
import { playTone } from '../../utils/storage';

// ─── Constants ────────────────────────────────────────────────────────────────

const ROWS = 6;
const COLS = 7;
const EMPTY = 0;
const HUMAN = 1;
const AI = 2;
const AI_DEPTH = 5;

const FRIENDLY_TAUNTS = [
  'FOUR IN A ROW! REMATCH?',
  'CALCULATED 5 MOVES AHEAD! 🤖',
  'WATCH THOSE DIAGONALS!',
  'GOOD GAME — TRY CLAIMING CENTER NEXT!',
  'TIDAL VICTORY FOR THE TRIGGERFISH!',
  'CLOSE MATCH! READY FOR ROUND TWO?',
];

// ─── Board Helpers ────────────────────────────────────────────────────────────

function emptyBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(EMPTY));
}

function cloneBoard(board) {
  return board.map((r) => [...r]);
}

function dropDisc(board, col, player) {
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r][col] === EMPTY) {
      const next = cloneBoard(board);
      next[r][col] = player;
      return { board: next, row: r };
    }
  }
  return null;
}

function colFull(board, col) {
  return board[0][col] !== EMPTY;
}

function validCols(board) {
  return Array.from({ length: COLS }, (_, c) => c).filter((c) => !colFull(board, c));
}

function findWin(board) {
  const dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const p = board[r][c];
      if (p === EMPTY) continue;
      for (const [dr, dc] of dirs) {
        const cells = [{ r, c }];
        for (let k = 1; k < 4; k++) {
          const nr = r + dr * k;
          const nc = c + dc * k;
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
  return board[0].every((cell) => cell !== EMPTY);
}

// ─── AI (Minimax + alpha-beta) ────────────────────────────────────────────────

function scoreWindow(window) {
  const aiCount = window.filter((x) => x === AI).length;
  const humanCount = window.filter((x) => x === HUMAN).length;
  const empty = window.filter((x) => x === EMPTY).length;

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
  const centre = board.map((r) => r[Math.floor(COLS / 2)]);
  score += centre.filter((x) => x === AI).length * 3;

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      score += scoreWindow([board[r][c], board[r][c + 1], board[r][c + 2], board[r][c + 3]]);
    }
  }
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r <= ROWS - 4; r++) {
      score += scoreWindow([board[r][c], board[r + 1][c], board[r + 2][c], board[r + 3][c]]);
    }
  }
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      score += scoreWindow([board[r][c], board[r + 1][c + 1], board[r + 2][c + 2], board[r + 3][c + 3]]);
    }
  }
  for (let r = 3; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      score += scoreWindow([board[r][c], board[r - 1][c + 1], board[r - 2][c + 2], board[r - 3][c + 3]]);
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
  }
  let best = Infinity;
  for (const col of cols) {
    const res = dropDisc(board, col, HUMAN);
    best = Math.min(best, minimax(res.board, depth - 1, alpha, beta, true));
    beta = Math.min(beta, best);
    if (alpha >= beta) break;
  }
  return best;
}

function bestAIMove(board) {
  const cols = validCols(board);
  let best = -Infinity;
  let bestCol = cols[Math.floor(cols.length / 2)];
  for (const col of cols) {
    const res = dropDisc(board, col, AI);
    const score = minimax(res.board, AI_DEPTH - 1, -Infinity, Infinity, false);
    if (score > best) {
      best = score;
      bestCol = col;
    }
  }
  return bestCol;
}

// ─── Component ────────────────────────────────────────────────────────────────

const ClownTriggerfish = ({ settings, onExit, onRecordResult }) => {
  const [board, setBoard] = useState(() => emptyBoard());
  const [turn, setTurn] = useState(HUMAN);
  const [phase, setPhase] = useState('playing');
  const [winner, setWinner] = useState(null);
  const [hoverCol, setHoverCol] = useState(null);
  const [dropping, setDropping] = useState(null);
  const [taunt, setTaunt] = useState(null);
  const [movesCount, setMovesCount] = useState(0);
  const aiThinkRef = useRef(false);

  useEffect(() => {
    if (turn !== AI || phase !== 'playing' || aiThinkRef.current) return undefined;
    aiThinkRef.current = true;

    const t = setTimeout(() => {
      setBoard((prev) => {
        const col = bestAIMove(prev);
        const result = dropDisc(prev, col, AI);
        if (!result) {
          aiThinkRef.current = false;
          return prev;
        }

        setDropping({ col, row: result.row, player: AI });

        setTimeout(() => {
          setDropping(null);
          setBoard(result.board);

          const win = findWin(result.board);
          if (win) {
            setWinner(win);
            setPhase('win');
            playTone('lose', settings?.soundEnabled);
            onRecordResult?.('clowntriggerfish', { won: false });
            if (win.player === AI) {
              const msg = FRIENDLY_TAUNTS[Math.floor(Math.random() * FRIENDLY_TAUNTS.length)];
              setTimeout(() => setTaunt(msg), 500);
            }
          } else if (isDraw(result.board)) {
            setPhase('draw');
            onRecordResult?.('clowntriggerfish', { won: false });
          } else {
            setTurn(HUMAN);
          }

          aiThinkRef.current = false;
        }, 320);

        return prev;
      });
    }, 360);

    return () => clearTimeout(t);
  }, [turn, phase, settings?.soundEnabled, onRecordResult]);

  const handleColClick = useCallback(
    (col) => {
      if (turn !== HUMAN || phase !== 'playing' || colFull(board, col)) return;

      const result = dropDisc(board, col, HUMAN);
      if (!result) return;

      playTone('click', settings?.soundEnabled);
      setMovesCount((m) => m + 1);
      setDropping({ col, row: result.row, player: HUMAN });

      setTimeout(() => {
        setDropping(null);
        setBoard(result.board);

        const win = findWin(result.board);
        if (win) {
          setWinner(win);
          setPhase('win');
          playTone('win', settings?.soundEnabled);
          onRecordResult?.('clowntriggerfish', { won: true });
        } else if (isDraw(result.board)) {
          setPhase('draw');
          onRecordResult?.('clowntriggerfish', { won: false });
        } else {
          setTurn(AI);
        }
      }, 320);
    },
    [turn, phase, board, settings?.soundEnabled, onRecordResult]
  );

  const restart = useCallback(() => {
    setBoard(emptyBoard());
    setTurn(HUMAN);
    setPhase('playing');
    setWinner(null);
    setHoverCol(null);
    setDropping(null);
    setTaunt(null);
    setMovesCount(0);
    aiThinkRef.current = false;
  }, []);

  const winSet = winner ? new Set(winner.cells.map(({ r, c }) => `${r}-${c}`)) : new Set();

  const previewRow =
    hoverCol !== null && turn === HUMAN && phase === 'playing' && !colFull(board, hoverCol)
      ? (() => {
          for (let r = ROWS - 1; r >= 0; r--) {
            if (board[r][hoverCol] === EMPTY) return r;
          }
          return -1;
        })()
      : -1;

  return (
    <div className="four-in-a-row-root">
      <ConfettiBurst
        active={phase === 'win' && winner?.player === HUMAN}
        reducedMotion={settings?.reducedMotion}
      />

      <div className="clown-brand">
        <img src="/brand/clown-triggerfish-logo.jpg" alt="Clown Triggerfish logo" />
        <div>
          <h2>Clown Triggerfish</h2>
          <a className="namesake-about" href="/about/clown-triggerfish/">About the Fish →</a>
        </div>
      </div>

      {/* Header */}
      <div className="four-in-a-row-header">
        <button type="button" className="btn-exit" onClick={onExit}>← Exit</button>
        <h1 className="four-in-a-row-title">Four in a Row</h1>
        <div className="four-in-a-row-turn-badge">
          {phase === 'playing' &&
            (turn === HUMAN ? (
              <span className="four-in-a-row-badge four-in-a-row-badge-human">🔴 Your Turn</span>
            ) : (
              <span className="four-in-a-row-badge four-in-a-row-badge-ai">🔵 AI Thinking…</span>
            ))}
          {phase === 'win' &&
            (winner.player === HUMAN ? (
              <span className="four-in-a-row-badge four-in-a-row-badge-human">🎉 You Win!</span>
            ) : (
              <span className="four-in-a-row-badge four-in-a-row-badge-ai">🤖 AI Wins!</span>
            ))}
          {phase === 'draw' && (
            <span className="four-in-a-row-badge four-in-a-row-badge-draw">🤝 Draw!</span>
          )}
        </div>
      </div>

      {/* Drop indicator strip */}
      <div className="four-in-a-row-indicator-row">
        {Array.from({ length: COLS }, (_, c) => (
          <div key={c} className="four-in-a-row-indicator-cell">
            {hoverCol === c && turn === HUMAN && phase === 'playing' && !colFull(board, c) && (
              <div className="four-in-a-row-indicator-disc four-in-a-row-disc-human" />
            )}
          </div>
        ))}
      </div>

      {/* Board */}
      <div className="four-in-a-row-board" onMouseLeave={() => setHoverCol(null)}>
        <div className="four-in-a-row-col-zones">
          {Array.from({ length: COLS }, (_, c) => (
            <button
              key={c}
              type="button"
              className="four-in-a-row-col-zone"
              aria-label={`Drop disc in column ${c + 1}`}
              onMouseEnter={() => setHoverCol(c)}
              onFocus={() => setHoverCol(c)}
              onClick={() => handleColClick(c)}
            />
          ))}
        </div>

        {Array.from({ length: ROWS }, (_, r) => (
          <div key={r} className="four-in-a-row-row">
            {Array.from({ length: COLS }, (_, c) => {
              const cell = board[r][c];
              const isWin = winSet.has(`${r}-${c}`);
              const isPreview = previewRow === r && hoverCol === c;
              const isDrop = dropping && dropping.col === c && dropping.row === r;

              let discCls = 'four-in-a-row-disc four-in-a-row-disc-empty';
              if (cell === HUMAN) {
                discCls = `four-in-a-row-disc four-in-a-row-disc-human ${isWin ? 'four-in-a-row-disc-win' : ''}`;
              }
              if (cell === AI) {
                discCls = `four-in-a-row-disc four-in-a-row-disc-ai ${isWin ? 'four-in-a-row-disc-win' : ''}`;
              }
              if (isDrop) discCls += ' four-in-a-row-disc-drop';
              if (isPreview && cell === EMPTY) discCls = 'four-in-a-row-disc four-in-a-row-disc-preview';

              return (
                <div key={c} className="four-in-a-row-cell">
                  <div className={discCls} />
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Actions */}
      {(phase === 'win' || phase === 'draw') && (
        <div className="four-in-a-row-end-wrap">
          <ShareResultButton
            title="🐠 Clown Triggerfish · Four in a Row"
            summary={
              phase === 'draw'
                ? `Battled to a tactical draw in ${movesCount} moves!`
                : winner?.player === HUMAN
                  ? `Connected four and defeated the AI in ${movesCount} moves!`
                  : `Played a ${movesCount}-move Four in a Row match against Clown Triggerfish AI.`
            }
            urlHash="clowntriggerfish"
          />
          <div className="four-in-a-row-end-actions">
            <button type="button" className="four-in-a-row-btn-play-again" onClick={restart}>
              Play Again
            </button>
          </div>
        </div>
      )}

      {phase === 'playing' && (
        <div className="four-in-a-row-end-actions">
          <button type="button" className="four-in-a-row-btn-restart" onClick={restart}>
            ↺ Restart
          </button>
        </div>
      )}

      {/* Friendly end-of-match overlay */}
      {taunt && (
        <div className="four-in-a-row-taunt-overlay" onClick={() => setTaunt(null)}>
          <div className="four-in-a-row-taunt-text">{taunt}</div>
          <div className="four-in-a-row-taunt-sub">click to dismiss</div>
        </div>
      )}
    </div>
  );
};

export default ClownTriggerfish;
