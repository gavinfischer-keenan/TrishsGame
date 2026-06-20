import { useState, useCallback } from 'react';

/**
 * SlippedMyMindGame.jsx — Core Mastermind-style game component
 *
 * Rules:
 *   - Computer generates a 5-ball secret code from 6 colours.
 *   - Player has 10 guesses.
 *   - After each guess: count of (exact: right colour + right slot),
 *     and (close: right colour, wrong slot).
 *   - Win = 5 exact. Lose = 10 guesses used up.
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
const MAX        = 10;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const randomCode = () =>
  Array.from({ length: CODE_LEN }, () =>
    COLOURS[Math.floor(Math.random() * COLOURS.length)].id
  );

function scoreGuess(code, guess) {
  let exact = 0, close = 0;
  const c = [...code], g = [...guess];
  for (let i = 0; i < CODE_LEN; i++) {
    if (g[i] === c[i]) { exact++; c[i] = g[i] = null; }
  }
  for (let i = 0; i < CODE_LEN; i++) {
    if (!g[i]) continue;
    const j = c.indexOf(g[i]);
    if (j !== -1) { close++; c[j] = null; }
  }
  return { exact, close };
}

// ─── Sub-components ──────────────────────────────────────────────────────────

/**
 * A single colour ball. If colorId is null, renders an empty slot.
 * ring   = purple selection ring
 * dim    = faded (future rows)
 * small  = history-row size (overrides size)
 */
const Ball = ({ colorId, size = 40, onClick, ring = false, dim = false }) => {
  const col = colorId ? COLOUR_MAP[colorId] : null;
  const base = {
    width: size, height: size,
    borderRadius: '50%',
    flexShrink: 0,
    cursor: onClick ? 'pointer' : 'default',
    transition: 'transform 0.1s, box-shadow 0.15s',
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

  return (
    <div style={{
      ...base,
      background: `radial-gradient(circle at 33% 28%, ${col.hi}, ${col.bg} 52%, ${col.sh})`,
      boxShadow: ring
        ? `0 0 0 3px #a78bfa, 0 0 18px rgba(167,139,250,0.65), inset 0 1px 0 rgba(255,255,255,0.3)`
        : `0 3px 10px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.25)`,
      opacity: dim ? 0.35 : 1,
    }} onClick={onClick} />
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
    guesses: [],                         // [{ colours:[], result:{exact,close} }]
    current: Array(CODE_LEN).fill(null), // the in-progress guess
    sel:     0,                          // selected slot index
    won:     false,
    over:    false,
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
      const guesses = [...p.guesses, { colours: [...p.current], result }];
      const won     = result.exact === CODE_LEN;
      const over    = won || guesses.length >= MAX;
      return { ...p, guesses, current: Array(CODE_LEN).fill(null), sel: 0, won, over };
    });
  }, []);

  const { code, guesses, current, sel, won, over } = st;
  const guessNum  = guesses.length + 1;
  const canSubmit = !over && current.every(Boolean);

  return (
    <div className="smm-game">

      {/* ── Header ── */}
      <header className="smm-header">
        <button className="btn-exit" onClick={onExit}>← Exit</button>
        <h2 className="smm-title">Slipped My Mind</h2>
        <div className="smm-counter">
          {over
            ? (won ? '🏆 Cracked!' : '💔 Game Over')
            : `Guess ${guessNum} / ${MAX}`}
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
      </div>

      {/* ── Guess board ── */}
      <div className="smm-board">

        {/* Past guesses */}
        {guesses.map((g, gi) => (
          <div key={gi} className="smm-row smm-row-past">
            <span className="smm-rnum">{gi + 1}</span>
            <div className="smm-row-balls">
              {g.colours.map((c, ci) => <Ball key={ci} colorId={c} size={36} />)}
            </div>
            <Pegs exact={g.result.exact} close={g.result.close} />
            <div className="smm-row-score">
              <span className="smm-score-exact" title="Right colour, right position">
                {g.result.exact > 0 ? `${g.result.exact}●` : ''}
              </span>
              <span className="smm-score-close" title="Right colour, wrong position">
                {g.result.close > 0 ? `${g.result.close}○` : ''}
              </span>
            </div>
          </div>
        ))}

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
                ? `Solved in ${guesses.length} guess${guesses.length !== 1 ? 'es' : ''}!`
                : 'The secret code was:'}
            </p>
            {!won && (
              <div className="smm-reveal">
                {code.map((c, i) => <Ball key={i} colorId={c} size={48} />)}
              </div>
            )}
            {won && (
              <p className="smm-win-sub">
                {guesses.length <= 3
                  ? '🔥 Incredible! Genius-level solving.'
                  : guesses.length <= 6
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
