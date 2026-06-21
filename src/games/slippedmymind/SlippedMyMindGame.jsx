import { useState, useCallback } from 'react';

/**
 * SlippedMyMindGame.jsx — Core Mastermind-style game component
 *
 * Rules:
 *   - Computer generates a 5-ball secret code from 6 colours.
 *   - Player has 15 guesses.
 *   - After each guess: count of (exact: right colour + right slot),
 *     and (close: right colour, wrong slot).
 *   - Win = 5 exact. Lose = 15 guesses used up.
 */

// ─── Colour definitions ──────────────────────────────────────────────────────

const COLOURS = [
  { id: 'red',    label: 'Red',    bg: '#dc2626', hi: '#f87171', sh: '#7f1d1d' },
  { id: 'green',  label: 'Green',  bg: '#15803d', hi: '#4ade80', sh: '#052e16' },
  { id: 'blue',   label: 'Blue',   bg: '#1d4ed8', hi: '#60a5fa', sh: '#1e3a8a' },
  { id: 'yellow', label: 'Yellow', bg: '#d97706', hi: '#fcd34d', sh: '#713f12' },
  { id: 'black',  label: 'Black',  bg: '#1f2937', hi: '#4b5563', sh: '#030712' },
  { id: 'white',  label: 'White',  bg: '#e2e8f0', hi: '#ffffff', sh: '#94a3b8' },
];

const COLOUR_MAP = Object.fromEntries(COLOURS.map(c => [c.id, c]));
const CODE_LEN   = 5;
const MAX        = 15;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const randomCode = () =>
  Array.from({ length: CODE_LEN }, () =>
    COLOURS[Math.floor(Math.random() * COLOURS.length)].id
  );

function scoreGuess(code, guess) {
  let exact = 0, close = 0;
  const matches = []; // { type: 'exact'|'close', guessIdx, codeIdx }
  const c = [...code], g = [...guess];
  
  // First pass: exact matches
  for (let i = 0; i < CODE_LEN; i++) {
    if (g[i] === c[i]) { 
      exact++; 
      matches.push({ type: 'exact', guessIdx: i, codeIdx: i });
      c[i] = g[i] = null; 
    }
  }
  
  // Second pass: close matches
  for (let i = 0; i < CODE_LEN; i++) {
    if (!g[i]) continue;
    const j = c.indexOf(g[i]);
    if (j !== -1) { 
      close++; 
      matches.push({ type: 'close', guessIdx: i, codeIdx: j });
      c[j] = null; 
    }
  }
  
  return { exact, close, matches };
}

// ─── Sub-components ──────────────────────────────────────────────────────────

/**
 * A single colour ball. If colorId is null, renders an empty slot.
 * ring     = purple selection ring
 * dim      = faded (future rows)
 * hintGlow = 'exact' | 'close' | null
 */
const Ball = ({ colorId, size = 40, onClick, ring = false, dim = false, hintGlow = null }) => {
  const col = colorId ? COLOUR_MAP[colorId] : null;
  const base = {
    width: size, height: size,
    borderRadius: '50%',
    flexShrink: 0,
    cursor: onClick ? 'pointer' : 'default',
    transition: 'transform 0.1s, box-shadow 0.15s',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  if (!col) {
    return (
      <div style={{
        ...base,
        background: ring ? 'rgba(167,139,250,0.14)' : 'rgba(255,255,255,0.04)',
        border:     ring ? '2.5px solid #a78bfa'    : '2px dashed rgba(255,255,255,0.18)',
        boxShadow:  ring ? '0 0 14px rgba(167,139,250,0.5)' : 'none',
        opacity: dim ? 0.28 : 1,
      }} onClick={onClick} />
    );
  }

  let boxShadow = ring
    ? `0 0 0 3px #a78bfa, 0 0 18px rgba(167,139,250,0.65), inset 0 1px 0 rgba(255,255,255,0.3)`
    : `0 3px 10px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.25)`;
    
  if (hintGlow === 'exact') {
    boxShadow = `0 0 0 3px #0ea5e9, 0 0 20px rgba(14,165,233,0.85), inset 0 1px 0 rgba(255,255,255,0.4)`;
  } else if (hintGlow === 'close') {
    boxShadow = `0 0 0 3px #facc15, 0 0 20px rgba(250,204,21,0.85), inset 0 1px 0 rgba(255,255,255,0.4)`;
  }

  return (
    <div style={{
      ...base,
      background: `radial-gradient(circle at 33% 28%, ${col.hi}, ${col.bg} 52%, ${col.sh})`,
      boxShadow,
      opacity: dim ? 0.35 : 1,
    }} onClick={onClick}>
       {hintGlow === 'exact' && <div className="smm-hint-icon" title="Right color, right place">🎯</div>}
       {hintGlow === 'close' && <div className="smm-hint-icon" title="Right color, wrong place">🔄</div>}
    </div>
  );
};

/**
 * 5 feedback pegs in a classic 3+2 Mastermind grid.
 * ● dark  = exact (right colour, right slot)
 * ● light = close (right colour, wrong slot)
 * ○       = no match
 */
const Pegs = ({ exact, close }) => {
  const types = [
    ...Array(exact).fill('exact'),
    ...Array(close).fill('close'),
    ...Array(CODE_LEN - exact - close).fill('none'),
  ];
  return (
    <div className="smm-pegs">
      <div className="smm-peg-row">{types.slice(0, 3).map((t, i) => <div key={i} className={`smm-peg smm-peg-${t}`} />)}</div>
      <div className="smm-peg-row">{types.slice(3).map((t, i)  => <div key={i} className={`smm-peg smm-peg-${t}`} />)}</div>
    </div>
  );
};

/** Mystery ball shown on the secret code row during play */
const Mystery = () => (
  <div className="smm-mystery">?</div>
);

// ─── Main component ───────────────────────────────────────────────────────────

const SlippedMyMindGame = ({ onExit }) => {
  const fresh = () => ({
    code:    randomCode(),
    guesses: [],                         // [{ type: 'guess'|'penalty', colours, result, hintedGuessIdx, hintType }]
    current: Array(CODE_LEN).fill(null), // the in-progress guess
    sel:     0,                          // selected slot index
    won:     false,
    over:    false,
    hintsUsed: 0,
    hintUsedThisTurn: false,
    hintedCodeSlots: [],                 // array of codeIdx already hinted
  });

  const [st, setSt] = useState(fresh);

  // Click a slot in the current row
  const handleSlot = useCallback((i) => {
    setSt(p => {
      if (p.over) return p;
      const cur = [...p.current];
      if (cur[i]) { cur[i] = null; return { ...p, current: cur, sel: i }; }
      return { ...p, sel: i };
    });
  }, []);

  // Click a colour from the palette
  const handleColour = useCallback((colId) => {
    setSt(p => {
      if (p.over) return p;
      // Use selected slot; if it's full try next empty
      let slot = p.sel ?? 0;
      if (p.current[slot] !== null) {
        // selected slot already filled → find next empty
        slot = p.current.findIndex(c => !c);
        if (slot < 0) return p; // all full, nothing to do
      }
      const cur = [...p.current];
      cur[slot] = colId;
      // Advance selection to next empty
      let next = cur.findIndex((c, i) => !c && i > slot);
      if (next < 0) next = cur.findIndex(c => !c);
      return { ...p, current: cur, sel: next < 0 ? null : next };
    });
  }, []);

  // Submit the current guess
  const handleSubmit = useCallback(() => {
    setSt(p => {
      if (p.over || p.current.some(c => !c)) return p;
      const result  = scoreGuess(p.code, p.current);
      const guesses = [...p.guesses, { 
        type: 'guess', 
        colours: [...p.current], 
        result,
        hintedGuessIdx: null,
        hintType: null,
      }];
      const won     = result.exact === CODE_LEN;
      const over    = won || guesses.length >= MAX;
      return { 
        ...p, 
        guesses, 
        current: Array(CODE_LEN).fill(null), 
        sel: 0, 
        won, 
        over,
        hintUsedThisTurn: false 
      };
    });
  }, []);

  // Trigger a hint
  const handleHint = useCallback(() => {
    setSt(p => {
      if (p.over || p.hintUsedThisTurn || p.guesses.length === 0) return p;
      
      // Get the last actual guess (skip penalty rows)
      let lastGuessIdx = p.guesses.length - 1;
      while (lastGuessIdx >= 0 && p.guesses[lastGuessIdx].type !== 'guess') {
        lastGuessIdx--;
      }
      if (lastGuessIdx < 0) return p; 
      
      const lastGuess = p.guesses[lastGuessIdx];
      
      // Find matches in the last guess that haven't been hinted yet
      const availableMatches = lastGuess.result.matches.filter(m => !p.hintedCodeSlots.includes(m.codeIdx));
      
      if (availableMatches.length === 0) return p; // no available hints
      
      // Bias towards close matches
      const closeMatches = availableMatches.filter(m => m.type === 'close');
      const pool = closeMatches.length > 0 ? closeMatches : availableMatches;
      const picked = pool[Math.floor(Math.random() * pool.length)];
      
      // Calculate turn penalty cost: 1, 2, 2, 3, 3, 4, 4...
      const costArray = [1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6];
      const cost = costArray[Math.min(p.hintsUsed, costArray.length - 1)];
      
      const newGuesses = [...p.guesses];
      newGuesses[lastGuessIdx] = {
        ...lastGuess,
        hintedGuessIdx: picked.guessIdx,
        hintType: picked.type,
      };
      
      const penaltyRows = Array(cost).fill({ type: 'penalty' });
      newGuesses.push(...penaltyRows);
      
      const over = newGuesses.length >= MAX || p.won;
      
      return {
        ...p,
        guesses: newGuesses,
        hintsUsed: p.hintsUsed + 1,
        hintUsedThisTurn: true,
        hintedCodeSlots: [...p.hintedCodeSlots, picked.codeIdx],
        over
      };
    });
  }, []);

  const { code, guesses, current, sel, won, over, hintUsedThisTurn, hintsUsed } = st;
  const guessNum  = guesses.length + 1;
  const canSubmit = !over && current.every(Boolean);
  const costArray = [1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6];
  const nextHintCost = costArray[Math.min(hintsUsed, costArray.length - 1)];
  const hasPastGuess = guesses.filter(g => g.type === 'guess').length > 0;

  return (
    <div className="smm-game">

      {/* ── Header ── */}
      <header className="smm-header">
        <button className="btn-exit" onClick={onExit}>← Exit</button>
        <h2 className="smm-title">Slipped My Mind</h2>
        <div className="smm-counter">
          {over
            ? (won ? '🏆 Cracked!' : '💔 Game Over')
            : `Turn ${Math.min(guessNum, MAX)} / ${MAX}`}
        </div>
      </header>

      {/* ── Secret code row ── */}
      <div className="smm-secret">
        <span className="smm-secret-label">Secret Code</span>
        <div className="smm-secret-balls">
          {code.map((c, i) =>
            over ? <Ball key={i} colorId={c} size={34} /> : <Mystery key={i} />
          )}
        </div>
        
        {/* Hint button */}
        {!over && (
          <button 
            className={`smm-hint-btn ${hintUsedThisTurn || !hasPastGuess ? 'smm-hint-disabled' : ''}`}
            disabled={hintUsedThisTurn || !hasPastGuess}
            onClick={handleHint}
            title={`Use Hint (Costs ${nextHintCost} Turn${nextHintCost > 1 ? 's' : ''})`}
          >
            💡 Hint
            {!hintUsedThisTurn && hasPastGuess && <span className="smm-hint-cost">-{nextHintCost}</span>}
          </button>
        )}
      </div>

      {/* ── Guess board ── */}
      <div className="smm-board">

        {/* Past guesses & Penalties */}
        {guesses.map((g, gi) => {
          if (g.type === 'penalty') {
            return (
              <div key={gi} className="smm-row smm-row-penalty">
                <span className="smm-rnum">{gi + 1}</span>
                <div className="smm-row-penalty-text">⚠️ Turn lost to hint penalty</div>
              </div>
            );
          }
          
          return (
            <div key={gi} className="smm-row smm-row-past">
              <span className="smm-rnum">{gi + 1}</span>
              <div className="smm-row-balls">
                {g.colours.map((c, ci) => (
                  <Ball 
                    key={ci} 
                    colorId={c} 
                    size={36} 
                    hintGlow={g.hintedGuessIdx === ci ? g.hintType : null}
                  />
                ))}
              </div>
              <Pegs exact={g.result.exact} close={g.result.close} />
              <div className="smm-row-score smm-row-score-text">
                {g.result.exact > 0 && (
                  <span className="smm-score-exact">
                    {g.result.exact} right color right place
                  </span>
                )}
                {g.result.exact > 0 && g.result.close > 0 && (
                  <span className="smm-score-sep"> - </span>
                )}
                {g.result.close > 0 && (
                  <span className="smm-score-close">
                    {g.result.close} right color
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {/* Active row */}
        {!over && (
          <div className="smm-row smm-row-active">
            <span className="smm-rnum">{guessNum}</span>
            <div className="smm-row-balls">
              {current.map((c, i) => (
                <Ball key={i} colorId={c} size={40}
                  ring={i === sel}
                  onClick={() => handleSlot(i)}
                />
              ))}
            </div>
            <div className="smm-pegs smm-pegs-placeholder" />
            <button
              className={`smm-check-btn${canSubmit ? ' smm-check-ready' : ''}`}
              disabled={!canSubmit}
              onClick={handleSubmit}
            >
              Check
            </button>
          </div>
        )}

        {/* Future (empty) rows */}
        {!over && Array.from({ length: MAX - guesses.length - 1 }, (_, i) => (
          <div key={i} className="smm-row smm-row-future">
            <span className="smm-rnum">{guesses.length + i + 2}</span>
            <div className="smm-row-balls">
              {Array(CODE_LEN).fill(null).map((_, ci) => <Ball key={ci} size={36} dim />)}
            </div>
          </div>
        ))}

      </div>

      {/* ── Colour palette ── */}
      {!over && (
        <div className="smm-palette">
          {COLOURS.map(col => (
            <button key={col.id} className="smm-pal-btn" onClick={() => handleColour(col.id)}>
              <Ball colorId={col.id} size={44} />
              <span className="smm-pal-label">{col.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* ── Game-over overlay ── */}
      {over && (
        <div className="smm-overlay">
          <div className="overlay-card smm-overlay-card">
            <div className="overlay-icon">{won ? '🧠' : '😅'}</div>
            <h2>{won ? 'You cracked it!' : 'Slipped Away!'}</h2>
            <p>
              {won
                ? `Solved using ${guesses.length} turns (Hints used: ${hintsUsed})`
                : 'The secret code was:'}
            </p>
            {!won && (
              <div className="smm-reveal">
                {code.map((c, i) => <Ball key={i} colorId={c} size={48} />)}
              </div>
            )}
            {won && (
              <p className="smm-win-sub">
                {guesses.length <= 4
                  ? '🔥 Incredible! Genius-level solving.'
                  : guesses.length <= 8
                    ? '⭐ Great work — solid deduction!'
                    : '👍 You got there! Keep practising.'}
              </p>
            )}
            <div className="overlay-actions">
              <button className="btn-primary" onClick={() => setSt(fresh())}>Play Again</button>
              <button className="btn-secondary" onClick={onExit}>← Back</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SlippedMyMindGame;
