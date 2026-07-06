import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import DICTIONARY from './dictionary';
import URBAN_DICTIONARY from './urbanDictionary';

// ─── Language Config (future-proofed) ────────────────────────────────────────

const LANGUAGES = [
  { code: 'en-US',  name: 'American English', flag: '🇺🇸', available: true,  dict: DICTIONARY },
  { code: 'en-URB', name: 'World Slang',      flag: '🌍', available: true,  dict: URBAN_DICTIONARY },
  { code: 'en-GB',  name: 'British English',  flag: '🇬🇧', available: false, dict: null },
  { code: 'es-ES',  name: 'Spanish',          flag: '🇪🇸', available: false, dict: null },
  { code: 'fr-FR',  name: 'French',           flag: '🇫🇷', available: false, dict: null },
  { code: 'de-DE',  name: 'German',           flag: '🇩🇪', available: false, dict: null },
];

// ─── Difficulty Helpers ───────────────────────────────────────────────────────

const STARTING_MONEY = 100;
const WAGER_PRESETS  = [5, 10, 25, 50];
const KEYBOARD_ROWS  = ['ABCDEFG', 'HIJKLMN', 'OPQRSTU', 'VWXYZ'];

function getTargetWordLength(wordsCompleted) {
  return Math.min(4 + Math.floor(wordsCompleted / 2), 11);
}

function getAllInTimeLimit(wordsCompleted) {
  // Start at 30s. Shrink by 2s every 2 words. Minimum 10s.
  return Math.max(10, 30 - Math.floor(wordsCompleted / 2) * 2);
}

// ─── Words exempt from being blanked ────────────────────────────────────────
// Articles and all forms of the verb "to be"
const EXEMPT_WORDS = new Set([
  'a', 'an', 'the',
  'be', 'been', 'being',
  'am', 'is', 'are',
  'was', 'were',
]);

function isExempt(rawWord) {
  const clean = rawWord.replace(/[^a-zA-Z]/g, '').toLowerCase();
  return EXEMPT_WORDS.has(clean);
}

/**
 * How many words to blank.
 *
 * Under $1,000:  gentle ramp based on words completed (0 → 5).
 * At $1,000+:    start at 2, then +1 every 3 successes since reaching $1k.
 *                Never exceeds (eligible blanking words in definition − 1),
 *                so at least one non-exempt word is always visible.
 *
 * @param {number} wordsCompleted  total words solved this session
 * @param {number} money           current balance
 * @param {number} wordsAt1k       wordsCompleted value at the moment the
 *                                 player first hit $1,000 (Infinity if never)
 * @param {number} maxEligible     how many non-exempt words are in the def
 */
function getDefinitionBlanks(wordsCompleted, money, wordsAt1k, maxEligible) {
  if (money >= 1000) {
    const successesSince = wordsCompleted - wordsAt1k;
    const count = 2 + Math.floor(Math.max(0, successesSince) / 3);
    // Cap: never blank all non-exempt words — always leave at least 1
    return Math.min(count, Math.max(0, maxEligible - 1));
  }
  // Legacy gentle ramp: 0 blanks for first 2 words, +1 every 3 after
  return Math.min(Math.floor(Math.max(0, wordsCompleted - 1) / 3), 5);
}

/**
 * Apply blanks to a definition string.
 * - Exempt words (articles, "to be" forms) are never blanked.
 * - Bias toward longer words (≥3 chars): they get 3 tickets vs 1 for short.
 * - Returns the masked string with ___ substituted.
 */
function applyDefinitionBlanks(definition, count) {
  if (count === 0) return definition;
  const words = definition.split(' ');

  // Build a weighted pool: each eligible index appears 3 times if len≥3, else 1
  const pool = [];
  words.forEach((w, i) => {
    if (!w || isExempt(w)) return;           // exempt
    if (!/^[a-zA-Z]/.test(w)) return;        // skip numeric / punctuation-only tokens
    const clean = w.replace(/[^a-zA-Z]/g, '');
    const tickets = clean.length >= 3 ? 3 : 1;
    for (let t = 0; t < tickets; t++) pool.push(i);
  });

  // Fisher-Yates shuffle of the pool, then pick unique indices
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  const toBlank = new Set();
  for (const idx of pool) {
    if (toBlank.size >= count) break;
    toBlank.add(idx);
  }

  return words.map((w, i) => {
    if (!toBlank.has(i)) return w;
    const trailingPunct = w.match(/[.,;:!?'"]+$/)?.[0] || '';
    return '___' + trailingPunct;
  }).join(' ');
}

/** Count how many non-exempt blanking-eligible words are in a definition. */
function countEligible(definition) {
  return definition.split(' ').filter(w =>
    w && !isExempt(w) && /^[a-zA-Z]/.test(w)
  ).length;
}

function pickWord(dict, wordsCompleted, usedWords) {
  const targetLen = getTargetWordLength(wordsCompleted);
  let candidates = dict.filter(e => !usedWords.has(e.word) && Math.abs(e.word.length - targetLen) <= 1);
  if (candidates.length === 0) candidates = dict.filter(e => !usedWords.has(e.word));
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

// ─── Menu ─────────────────────────────────────────────────────────────────────

const Menu = ({ onPlay, language, onLanguageChange, onExit }) => (
  <div className="ww-menu" style={{ position: 'relative' }}>
    <div style={{ width: '100%', padding: '1rem', position: 'absolute', top: 0, left: 0 }}>
      <button className="btn-exit" onClick={onExit}>← Exit</button>
    </div>
    <div className="ww-menu-content">
      <div className="ww-menu-hero">
        <div className="ww-menu-icon">💰</div>
        <h1 className="ww-menu-title">Word Wager</h1>
        <p className="ww-menu-tagline">Bet your way to glory — or bust</p>
      </div>

      <div className="ww-menu-rules">
        <div className="ww-rule">
          <span className="ww-rule-icon">📖</span>
          <div><strong>Definition clue</strong> — guess the hidden word letter by letter.</div>
        </div>
        <div className="ww-rule">
          <span className="ww-rule-icon">💵</span>
          <div>Wager before each letter. <span className="ww-money-pos">Correct → +wager</span>. <span className="ww-money-neg">Wrong → −2× wager</span>.</div>
        </div>
        <div className="ww-rule">
          <span className="ww-rule-icon">🎰</span>
          <div><strong>Guess Whole Word</strong> before any letters — <em>double or nothing!</em></div>
        </div>
        <div className="ww-rule">
          <span className="ww-rule-icon">📈</span>
          <div>Words get longer and definitions gain blanks as you progress.</div>
        </div>
      </div>

      <div className="ww-lang-section">
        <div className="ww-lang-label">🌐 Language</div>
        <div className="ww-lang-grid">
          {LANGUAGES.map(lang => (
            <button
              key={lang.code}
              className={`ww-lang-btn ${language === lang.code ? 'ww-lang-btn-active' : ''} ${!lang.available ? 'ww-lang-btn-locked' : ''}`}
              onClick={() => lang.available && onLanguageChange(lang.code)}
              disabled={!lang.available}
            >
              <span className="ww-lang-flag">{lang.flag}</span>
              <span className="ww-lang-name">{lang.name}</span>
              {!lang.available && <span className="ww-lang-soon">Soon</span>}
            </button>
          ))}
        </div>
      </div>

      <button className="ww-play-btn" onClick={onPlay}>
        Start with ${STARTING_MONEY} →
      </button>
    </div>
  </div>
);

// ─── Game Over Overlay ────────────────────────────────────────────────────────

const GameOverOverlay = ({ money, wordsCompleted, word, onPlayAgain, onExit }) => (
  <div className="smm-overlay">
    <div className="overlay-card smm-overlay-card ww-overlay-card">
      <div className="overlay-icon">💸</div>
      <h2>Broke!</h2>
      <p>You ran out of money after solving <strong>{wordsCompleted}</strong> {wordsCompleted === 1 ? 'word' : 'words'}.</p>
      {word && (
        <div style={{ marginBottom: '0.75rem' }}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
            The word that got you:
          </div>
          <div className="ww-revealed-word">{word}</div>
        </div>
      )}
      <div className="ww-result-stats">
        <div className="ww-stat-box">
          <div className="ww-stat-num">{wordsCompleted}</div>
          <div className="ww-stat-lbl">Words Solved</div>
        </div>
        <div className="ww-stat-box">
          <div className="ww-stat-num">${money}</div>
          <div className="ww-stat-lbl">Final Balance</div>
        </div>
      </div>
      <div className="overlay-actions">
        <button className="btn-primary" onClick={onPlayAgain}>Play Again</button>
        <button className="btn-secondary" onClick={onExit}>Main Menu</button>
      </div>
    </div>
  </div>
);

// ─── Word Complete Overlay ─────────────────────────────────────────────────────

const WordCompleteOverlay = ({ word, wordsCompleted, newMoney, onContinue }) => (
  <div className="smm-overlay">
    <div className="overlay-card smm-overlay-card ww-overlay-card ww-wordwin-card">
      <div className="overlay-icon">✨</div>
      <h2>Word #{wordsCompleted} Solved!</h2>
      <div className="ww-revealed-word">{word}</div>
      <p>Balance: <strong className="ww-money-pos">${newMoney}</strong></p>
      <div className="overlay-actions">
        <button className="btn-primary" onClick={onContinue}>Next Word →</button>
      </div>
    </div>
  </div>
);


// ─── Game ─────────────────────────────────────────────────────────────────────

const Game = ({ dictionary, onExit }) => {
  const freshState = useCallback(() => {
    const fresh = new Set();
    return {
      money:          STARTING_MONEY,
      wordsCompleted: 0,
      usedWords:      fresh,
      wordObj:        pickWord(dictionary, 0, fresh),
      wager:          10,
    };
  }, [dictionary]);

  const [money,          setMoney]          = useState(STARTING_MONEY);
  const [wordsCompleted, setWordsCompleted] = useState(0);
  const [usedWords,      setUsedWords]      = useState(() => new Set());
  const [wordObj,        setWordObj]        = useState(() => pickWord(dictionary, 0, new Set()));
  const [guessed,        setGuessed]        = useState(() => new Set());
  const [wager,          setWager]          = useState(10);
  const [customWager,    setCustomWager]    = useState('');
  const [phase,          setPhase]          = useState('playing'); // playing | word-complete | game-over
  const [isAllIn,        setIsAllIn]        = useState(false);
  const [timeLeft,       setTimeLeft]       = useState(null);
  const [flashMsg,       setFlashMsg]       = useState(null);       // { text, ok }
  const [wordStartMoney, setWordStartMoney] = useState(STARTING_MONEY);
  // Track the wordsCompleted value at the moment the player first hit $1,000.
  // Starts as Infinity (not yet reached). Set once and never reset mid-run.
  const [wordsAt1k,      setWordsAt1k]      = useState(Infinity);

  // Derived values
  const maxEligible  = useMemo(() => wordObj ? countEligible(wordObj.definition) : 0, [wordObj]);
  const blanks       = getDefinitionBlanks(wordsCompleted, money, wordsAt1k, maxEligible);
  const maskedDef    = useMemo(() => {
    if (!wordObj) return '';
    const def = applyDefinitionBlanks(wordObj.definition, blanks);
    // Auto-censor the target word (and basic suffixes) if it appears in the definition
    const regex = new RegExp(`\\b${wordObj.word}(s|es|ed|ing)?\\b`, 'gi');
    return def.split(' ').map(w => w.replace(regex, '___')).join(' ');
  }, [wordObj, blanks]);

  const wordLetters  = useMemo(() => wordObj ? [...new Set(wordObj.word.split(''))] : [], [wordObj]);
  const correctSet   = useMemo(() => new Set(wordLetters.filter(l => guessed.has(l))), [wordLetters, guessed]);
  const wrongList    = useMemo(() => [...guessed].filter(l => !wordLetters.includes(l)), [guessed, wordLetters]);
  const effectiveWager = Math.max(1, Math.min(wager, money));

  const diffLabel = (() => {
    const len = getTargetWordLength(wordsCompleted);
    if (len <= 5) return { label: 'Easy',   cls: 'ww-diff-easy'   };
    if (len <= 7) return { label: 'Medium', cls: 'ww-diff-medium' };
    if (len <= 9) return { label: 'Hard',   cls: 'ww-diff-hard'   };
    return               { label: 'Expert', cls: 'ww-diff-expert' };
  })();

  // Flash helper
  const flash = (text, ok) => {
    setFlashMsg({ text, ok });
    setTimeout(() => setFlashMsg(null), 1800);
  };

  // ── Timer Effect ───────────────────────────────────────────────
  useEffect(() => {
    if (!isAllIn || phase !== 'playing' || timeLeft === null) return;

    if (timeLeft <= 0) {
      setMoney(0);
      setPhase('game-over');
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(t => t - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isAllIn, phase, timeLeft]);

  // ── Handle letter guess ────────────────────────────────────────
  const handleLetter = useCallback((letter) => {
    if (phase !== 'playing' || guessed.has(letter) || !wordObj) return;

    const isHit = wordObj.word.includes(letter);
    let delta = 0;

    if (isAllIn) {
      if (!isHit) {
        // Wrong letter while All-In = game over
        delta = -money;
      }
    } else {
      delta = isHit ? effectiveWager : -effectiveWager;
    }

    const newMon  = Math.max(0, money + delta);
    const newGues = new Set([...guessed, letter]);

    setGuessed(newGues);
    setMoney(newMon);

    if (isAllIn) {
      if (!isHit) {
        flash(`✗ "${letter}" not in the word! All-In failed! −$${money}`, false);
      } else {
        flash(`✓ "${letter}" is in the word!`, true);
      }
    } else {
      flash(
        isHit
          ? `✓ "${letter}" is in the word! +$${effectiveWager}`
          : `✗ "${letter}" not in the word! −$${effectiveWager}`,
        isHit
      );
    }

    // Word complete?
    const wordDone = wordObj.word.split('').every(l => newGues.has(l));
    if (wordDone) {
      const newCount = wordsCompleted + 1;
      const newUsed  = new Set([...usedWords, wordObj.word]);
      
      let finalMon = newMon;
      if (isAllIn && newMon > 0) {
        // All letters typed correctly -> get the bonus
        finalMon += money;
        setMoney(finalMon);
        flash(`🎉 All-In Success! Double Money! +$${money}`, true);
      }

      setWordsCompleted(newCount);
      setUsedWords(newUsed);
      // Record the first time the player hits $1k
      if (finalMon >= 1000 && wordsAt1k === Infinity) {
        setWordsAt1k(wordsCompleted);
      }
      setTimeout(() => setPhase('word-complete'), 700);
      return;
    }

    // Game over?
    if (newMon <= 0) {
      setTimeout(() => setPhase('game-over'), 700);
    }
  }, [phase, guessed, wordObj, effectiveWager, money, wordsCompleted, usedWords, isAllIn, wordsAt1k]);

  // ── Handle Hint ────────────────────────────────────────────────
  const handleHint = useCallback(() => {
    if (phase !== 'playing' || money < 15 || !wordObj) return;

    const unrevealedLetters = wordObj.word.split('').filter(l => !guessed.has(l));
    if (unrevealedLetters.length === 0) return;

    const hintLetter = unrevealedLetters[Math.floor(Math.random() * unrevealedLetters.length)];
    
    const newMon  = money - 15;
    const newGues = new Set([...guessed, hintLetter]);

    setGuessed(newGues);
    setMoney(newMon);

    flash(`💡 Hint used: "${hintLetter}" revealed for $15`, true);

    // Word complete?
    const wordDone = wordObj.word.split('').every(l => newGues.has(l));
    if (wordDone) {
      const newCount = wordsCompleted + 1;
      const newUsed  = new Set([...usedWords, wordObj.word]);
      
      let finalMon = newMon;
      if (isAllIn && newMon > 0) {
        // Double whatever is left
        finalMon += newMon;
        setMoney(finalMon);
        flash(`🎉 All-In Success! Double Money! +$${newMon}`, true);
      }

      setWordsCompleted(newCount);
      setUsedWords(newUsed);
      if (finalMon >= 1000 && wordsAt1k === Infinity) {
        setWordsAt1k(wordsCompleted);
      }
      setTimeout(() => setPhase('word-complete'), 700);
      return;
    }
  }, [phase, guessed, wordObj, money, wordsCompleted, usedWords, isAllIn, wordsAt1k]);

  // ── Continue to next word ──────────────────────────────────────
  const handleContinue = useCallback(() => {
    const next = pickWord(dictionary, wordsCompleted, usedWords);
    setWordObj(next);
    setGuessed(new Set());
    setFlashMsg(null);
    setWordStartMoney(money);
    setWager(prev => Math.max(1, Math.min(prev, money)));
    setCustomWager('');
    setIsAllIn(false);
    setTimeLeft(null);
    setPhase('playing');
  }, [wordsCompleted, usedWords, money, dictionary]);

  // ── Play again ─────────────────────────────────────────────────
  const handlePlayAgain = useCallback(() => {
    const fresh = new Set();
    setMoney(STARTING_MONEY);
    setWordsCompleted(0);
    setUsedWords(fresh);
    setWordObj(pickWord(dictionary, 0, fresh));
    setGuessed(new Set());
    setFlashMsg(null);
    setWager(10);
    setCustomWager('');
    setWordStartMoney(STARTING_MONEY);
    setWordsAt1k(Infinity);
    setIsAllIn(false);
    setTimeLeft(null);
    setPhase('playing');
  }, []);

  if (!wordObj) {
    return (
      <div className="ww-game">
        <div className="ww-header">
          <button className="btn-exit" onClick={onExit}>← Exit</button>
        </div>
        <div className="ww-no-words">🎉 You've solved every word in the dictionary!</div>
      </div>
    );
  }

  return (
    <div className="ww-game">

      {/* ── Header ── */}
      <div className="ww-header">
        <button className="btn-exit" onClick={onExit}>← Exit</button>
        <div className="ww-money-display">
          <span className="ww-money-label">💰</span>
          <span className="ww-money-value">${money}</span>
        </div>
        <div className="ww-header-right">
          <button 
            className="ww-hint-btn" 
            onClick={handleHint}
            disabled={money < 15 || phase !== 'playing'}
            title="Reveal a random letter for $15"
          >
            💡 Hint ($15)
          </button>
          <div className="ww-diff-group">
            <span className="ww-word-num">Word #{wordsCompleted + 1}</span>
            <span className={`ww-diff-badge ${diffLabel.cls}`}>{diffLabel.label}</span>
          </div>
        </div>
      </div>

      {/* ── Flash message ── */}
      <div className={`ww-flash ${flashMsg ? 'ww-flash-show' : ''} ${flashMsg?.ok ? 'ww-flash-ok' : 'ww-flash-bad'}`}>
        {flashMsg?.text}
      </div>

      {/* ── Definition ── */}
      <div className="ww-def-section">
        <div className="ww-def-pos">
          {wordObj.pos}
          {wordObj.region && wordObj.region !== 'US / Internet' && (
            <span style={{ color: '#94a3b8', marginLeft: '10px', textTransform: 'none', letterSpacing: 'normal' }}>
              🌍 {wordObj.region}
            </span>
          )}
        </div>
        <p className="ww-definition">
          {maskedDef.split(' ').map((token, i) => {
            const isBlank = token.startsWith('___');
            // For blanked tokens, render the original word (hidden by CSS) so
            // the black bar is naturally as wide as the real word.
            const originalWord = isBlank
              ? (wordObj.definition.split(' ')[i] || '')
              : token;
            return (
              <span
                key={i}
                className={isBlank ? 'ww-blank-token' : ''}
                aria-hidden={isBlank ? 'true' : undefined}
              >
                {originalWord}{' '}
              </span>
            );
          })}
        </p>
        {blanks > 0 && (
          <div className="ww-blanks-hint">
            ⚠ {blanks} word{blanks > 1 ? 's' : ''} removed from definition
          </div>
        )}
      </div>

      {/* ── Word board ── */}
      <div className="ww-board-section">
        <div className="ww-letter-row">
          {wordObj.word.split('').map((letter, i) => (
            <div key={i} className={`ww-sq ${guessed.has(letter) ? 'ww-sq-revealed' : ''}`}>
              {guessed.has(letter) ? letter : ''}
            </div>
          ))}
        </div>

        <div className="ww-guesses-strip">
          {[...correctSet].length > 0 && (
            <div className="ww-guess-group">
              <span className="ww-gl ww-gl-ok">✓</span>
              {[...correctSet].map(l => <span key={l} className="ww-gl ww-gl-ok">{l}</span>)}
            </div>
          )}
          {wrongList.length > 0 && (
            <div className="ww-guess-group">
              <span className="ww-gl ww-gl-bad">✗</span>
              {wrongList.map(l => <span key={l} className="ww-gl ww-gl-bad">{l}</span>)}
            </div>
          )}
        </div>
      </div>

      {/* ── All In Button (only before any letters) ── */}
      {guessed.size === 0 && phase === 'playing' && !isAllIn && (
        <div className="ww-whole-row">
          <button className="ww-whole-btn" onClick={() => {
            setIsAllIn(true);
            setTimeLeft(getAllInTimeLimit(wordsCompleted));
          }}>
            🎰 GO ALL IN! — Double or Nothing
          </button>
        </div>
      )}

      {/* ── Wager controls ── */}
      {!isAllIn ? (
        <div className="ww-wager-section">
          <div className="ww-wager-top">
            <span className="ww-wager-title">Wager per letter</span>
            <span className="ww-wager-math">
              <span className="ww-money-pos">+${effectiveWager}</span> correct &nbsp;|&nbsp;
              <span className="ww-money-neg">−${effectiveWager}</span> wrong
            </span>
          </div>
          <div className="ww-chips">
            {WAGER_PRESETS.map(amt => (
              <button
                key={amt}
                className={`ww-chip ${effectiveWager === amt ? 'ww-chip-on' : ''}`}
                onClick={() => { setWager(amt); setCustomWager(''); }}
                disabled={amt > money}
              >
                ${amt}
              </button>
            ))}
            <input
              className="ww-custom-wager"
              type="number"
              min={1}
              max={money}
              placeholder="Custom"
              value={customWager}
              onChange={e => {
                setCustomWager(e.target.value);
                const v = parseInt(e.target.value);
                if (!isNaN(v) && v >= 1) setWager(Math.min(v, money));
              }}
            />
          </div>
        </div>
      ) : (
        <div className="ww-wager-section" style={{ textAlign: 'center' }}>
          <div className={`ww-timer ${timeLeft !== null && timeLeft <= 10 ? 'ww-timer-panic' : ''}`}>
            {timeLeft !== null ? timeLeft : ''}
          </div>
          <p style={{ color: '#fbbf24', margin: '0.25rem 0', fontWeight: 'bold' }}>
            🎰 ALL IN MODE ACTIVE!
          </p>
          <p style={{ color: '#f87171', margin: 0, fontSize: '0.85rem' }}>
            Any wrong letter = Game Over. Correct letters give no points.
          </p>
          <button 
            onClick={() => {
              setIsAllIn(false);
              setTimeLeft(null);
            }}
            style={{ 
              marginTop: '0.75rem', 
              background: 'transparent', 
              border: '1px solid rgba(248,113,113,0.5)', 
              color: '#f87171',
              padding: '0.25rem 0.75rem',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Cancel All-In
          </button>
        </div>
      )}

      {/* ── Keyboard ── */}
      <div className="ww-keyboard">
        {KEYBOARD_ROWS.map((row, ri) => (
          <div key={ri} className="ww-key-row">
            {row.split('').map(letter => {
              const hit  = guessed.has(letter) && wordObj.word.includes(letter);
              const miss = guessed.has(letter) && !wordObj.word.includes(letter);
              return (
                <button
                  key={letter}
                  className={`ww-key ${hit ? 'ww-key-hit' : miss ? 'ww-key-miss' : guessed.has(letter) ? 'ww-key-used' : ''}`}
                  onClick={() => handleLetter(letter)}
                  disabled={guessed.has(letter) || phase !== 'playing'}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* ── Overlays ── */}
      {phase === 'word-complete' && (
        <WordCompleteOverlay
          word={wordObj.word}
          wordsCompleted={wordsCompleted}
          newMoney={money}
          onContinue={handleContinue}
        />
      )}

      {phase === 'game-over' && (
        <GameOverOverlay
          money={money}
          wordsCompleted={wordsCompleted}
          word={wordObj?.word}
          onPlayAgain={handlePlayAgain}
          onExit={onExit}
        />
      )}
    </div>
  );
};

// ─── Root ─────────────────────────────────────────────────────────────────────

const WordWager = ({ onExit }) => {
  const [phase,    setPhase]    = useState('menu');
  const [language, setLanguage] = useState('en-US');

  const selectedLang = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

  if (phase === 'game') return <Game dictionary={selectedLang.dict} onExit={() => setPhase('menu')} />;

  return (
    <Menu
      language={language}
      onLanguageChange={setLanguage}
      onPlay={() => setPhase('game')}
      onExit={onExit}
    />
  );
};

export default WordWager;
