import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import DICTIONARY from './dictionary';
import WORLD_ENGLISH_DICTIONARY from './worldEnglishDictionary';
import ConfettiBurst from '../../components/ConfettiBurst';
import ShareResultButton from '../../components/ShareResultButton';
import { playTone } from '../../utils/storage';

// ─── Dictionary Config ────────────────────────────────────────────────────────

const DICTIONARIES = [
  { code: 'en-US', name: 'American English', flag: '🇺🇸', dict: DICTIONARY },
  { code: 'world-english', name: 'World & Regional English', flag: '🌍', dict: WORLD_ENGLISH_DICTIONARY },
];

// ─── Difficulty & Helpers ─────────────────────────────────────────────────────

const STARTING_MONEY = 100;
const WAGER_PRESETS = [5, 10, 25, 50];
const KEYBOARD_ROWS = ['ABCDEFG', 'HIJKLMN', 'OPQRSTU', 'VWXYZ'];

function getTargetWordLength(wordsCompleted) {
  return Math.min(4 + Math.floor(wordsCompleted / 2), 11);
}

function getAllInTimeLimit(wordsCompleted) {
  return Math.max(10, 30 - Math.floor(wordsCompleted / 2) * 2);
}

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

function getDefinitionBlanks(wordsCompleted, money, wordsAt1k, maxEligible) {
  if (money >= 1000) {
    const successesSince = wordsCompleted - wordsAt1k;
    const count = 2 + Math.floor(Math.max(0, successesSince) / 3);
    return Math.min(count, Math.max(0, maxEligible - 1));
  }
  return Math.min(Math.floor(Math.max(0, wordsCompleted - 1) / 3), 5);
}

function createMaskIndices(definition, count) {
  if (count === 0 || !definition) return [];
  const words = definition.split(' ');
  const pool = [];
  words.forEach((w, i) => {
    if (!w || isExempt(w)) return;
    if (!/^[a-zA-Z]/.test(w)) return;
    const clean = w.replace(/[^a-zA-Z]/g, '');
    const tickets = clean.length >= 3 ? 3 : 1;
    for (let t = 0; t < tickets; t++) pool.push(i);
  });

  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  const picked = new Set();
  for (const idx of pool) {
    if (picked.size >= count) break;
    picked.add(idx);
  }
  return [...picked];
}

function countEligible(definition) {
  return definition.split(' ').filter((w) => w && !isExempt(w) && /^[a-zA-Z]/.test(w)).length;
}

function pickWord(dict, wordsCompleted, usedWords) {
  const targetLen = getTargetWordLength(wordsCompleted);
  let candidates = dict.filter((e) => !usedWords.has(e.word) && Math.abs(e.word.length - targetLen) <= 1);
  if (candidates.length === 0) candidates = dict.filter((e) => !usedWords.has(e.word));
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

// ─── Menu ─────────────────────────────────────────────────────────────────────

const Menu = ({ onPlay, language, onLanguageChange, onExit }) => (
  <div className="ww-menu">
    <div className="ww-menu-content">
      <div className="game-menu-top">
        <button type="button" className="btn-back-home" onClick={onExit}>← Back to Games</button>
      </div>

      <div className="ww-menu-hero">
        <img className="namesake-menu-logo" src="/brand/alphabet-cone-snail-logo-v2.jpg" alt="Alphabet Cone Snail logo" />
        <h2 className="namesake-animal">Alphabet Cone Snail</h2>
        <h1 className="ww-menu-title">Word Wager</h1>
        <a className="namesake-about" href="/about/alphabet-cone-snail/">About the Snail →</a>
        <p className="ww-menu-tagline">Wager smart, read the clues, and solve the word</p>
      </div>

      <div className="ww-menu-rules">
        <div className="ww-rule">
          <span className="ww-rule-icon">📖</span>
          <div><strong>Definition clue</strong> — uncover the hidden word letter by letter (or type A–Z on your keyboard).</div>
        </div>
        <div className="ww-rule">
          <span className="ww-rule-icon">💵</span>
          <div>
            Play money only — no purchases or payouts. Set your wager before each letter:{' '}
            <span className="ww-money-pos">Correct → +wager</span> ·{' '}
            <span className="ww-money-neg">Wrong → −wager</span>.
          </div>
        </div>
        <div className="ww-rule">
          <span className="ww-rule-icon">🎰</span>
          <div><strong>Go All In</strong> before any letters — <em>double your balance or bust!</em></div>
        </div>
        <div className="ww-rule">
          <span className="ww-rule-icon">📈</span>
          <div>Words grow longer and definitions gain mystery blanks as your streak rises.</div>
        </div>
      </div>

      <div className="ww-lang-section">
        <div className="ww-lang-label">🌐 Word Deck</div>
        <div className="ww-lang-grid">
          {DICTIONARIES.map((lang) => (
            <button
              key={lang.code}
              type="button"
              className={`ww-lang-btn ${language === lang.code ? 'ww-lang-btn-active' : ''}`}
              onClick={() => onLanguageChange(lang.code)}
            >
              <span className="ww-lang-flag">{lang.flag}</span>
              <span className="ww-lang-name">{lang.name}</span>
              <span className="ww-lang-count">{lang.dict.length} words</span>
            </button>
          ))}
        </div>
      </div>

      <button type="button" className="ww-play-btn" onClick={onPlay}>
        Start with ${STARTING_MONEY} →
      </button>
    </div>
  </div>
);

// ─── Game Over Overlay ────────────────────────────────────────────────────────

const GameOverOverlay = ({ money, wordsCompleted, peakMoney, word, onPlayAgain, onExit }) => (
  <div className="smm-overlay">
    <div className="overlay-card smm-overlay-card ww-overlay-card">
      <div className="overlay-icon">💸</div>
      <h2>Out of Play Money!</h2>
      <p>
        You solved <strong>{wordsCompleted}</strong> {wordsCompleted === 1 ? 'word' : 'words'} this run.
      </p>
      {word && (
        <div className="ww-revealed-wrap">
          <div className="ww-revealed-label">The word was:</div>
          <div className="ww-revealed-word">{word}</div>
        </div>
      )}
      <div className="ww-result-stats">
        <div className="ww-stat-box">
          <div className="ww-stat-num">{wordsCompleted}</div>
          <div className="ww-stat-lbl">Words Solved</div>
        </div>
        <div className="ww-stat-box">
          <div className="ww-stat-num">${peakMoney}</div>
          <div className="ww-stat-lbl">Peak Balance</div>
        </div>
        <div className="ww-stat-box">
          <div className="ww-stat-num">${money}</div>
          <div className="ww-stat-lbl">Final</div>
        </div>
      </div>
      <ShareResultButton
        title="🐚 Alphabet Cone Snail · Word Wager"
        summary={`Solved ${wordsCompleted} word${wordsCompleted === 1 ? '' : 's'} with a peak balance of $${peakMoney} play money!`}
        urlHash="wordwager"
      />
      <div className="overlay-actions">
        <button type="button" className="btn-primary" onClick={onPlayAgain}>Play Again</button>
        <button type="button" className="btn-secondary" onClick={onExit}>Deck Menu</button>
      </div>
    </div>
  </div>
);

// ─── Word Complete Overlay ────────────────────────────────────────────────────

const WordCompleteOverlay = ({ word, wordsCompleted, newMoney, reducedMotion, onContinue }) => (
  <div className="smm-overlay">
    <ConfettiBurst active reducedMotion={reducedMotion} />
    <div className="overlay-card smm-overlay-card ww-overlay-card ww-wordwin-card">
      <div className="overlay-icon">✨</div>
      <h2>Word #{wordsCompleted} Solved!</h2>
      <div className="ww-revealed-word">{word}</div>
      <p>
        Balance: <strong className="ww-money-pos">${newMoney}</strong>
      </p>
      <ShareResultButton
        title="🐚 Alphabet Cone Snail · Word Wager"
        summary={`Solved "${word}" (Word #${wordsCompleted}) and reached $${newMoney} play money!`}
        urlHash="wordwager"
      />
      <div className="overlay-actions">
        <button type="button" className="btn-primary" onClick={onContinue}>Next Word →</button>
      </div>
    </div>
  </div>
);

// ─── Game ─────────────────────────────────────────────────────────────────────

function initWordRound(dict, wordsCompleted, usedWords, money, wordsAt1k) {
  const nextWord = pickWord(dict, wordsCompleted, usedWords);
  if (!nextWord) return { wordObj: null, blankSet: new Set() };
  const maxElig = countEligible(nextWord.definition);
  const blanks = getDefinitionBlanks(wordsCompleted, money, wordsAt1k, maxElig);
  const indices = createMaskIndices(nextWord.definition, blanks);
  return { wordObj: nextWord, blankSet: new Set(indices) };
}

const Game = ({ dictionary, settings, onExit, onRecordResult }) => {
  const [money, setMoney] = useState(STARTING_MONEY);
  const [peakMoney, setPeakMoney] = useState(STARTING_MONEY);
  const [wordsCompleted, setWordsCompleted] = useState(0);
  const [usedWords, setUsedWords] = useState(() => new Set());
  const [round, setRound] = useState(() => initWordRound(dictionary, 0, new Set(), STARTING_MONEY, Infinity));
  const [guessed, setGuessed] = useState(() => new Set());
  const [wager, setWager] = useState(10);
  const [customWager, setCustomWager] = useState('');
  const [phase, setPhase] = useState('playing'); // playing | word-complete | game-over
  const [isAllIn, setIsAllIn] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [flashMsg, setFlashMsg] = useState(null);
  const [wordsAt1k, setWordsAt1k] = useState(Infinity);
  const flashTimerRef = useRef(null);

  const wordObj = round.wordObj;
  const blankSet = round.blankSet;
  const blanks = blankSet.size;

  const wordTokens = useMemo(() => {
    if (!wordObj) return [];
    const selfRegex = new RegExp(`^${wordObj.word}(s|es|ed|ing)?$`, 'i');
    return wordObj.definition.split(' ').map((raw, i) => {
      const stripped = raw.replace(/[^a-zA-Z]/g, '');
      const isBlank = blankSet.has(i) || selfRegex.test(stripped);
      return { raw, isBlank };
    });
  }, [wordObj, blankSet]);

  const wordLetters = useMemo(() => (wordObj ? [...new Set(wordObj.word.split(''))] : []), [wordObj]);
  const correctSet = useMemo(() => new Set(wordLetters.filter((l) => guessed.has(l))), [wordLetters, guessed]);
  const wrongList = useMemo(() => [...guessed].filter((l) => !wordLetters.includes(l)), [guessed, wordLetters]);
  const effectiveWager = Math.max(1, Math.min(wager, money));
  const smartWager = Math.max(1, Math.min(money, Math.round((money * 0.2) / 5) * 5 || Math.ceil(money * 0.2)));

  const diffLabel = (() => {
    const len = getTargetWordLength(wordsCompleted);
    if (len <= 5) return { label: 'Easy', cls: 'ww-diff-easy' };
    if (len <= 7) return { label: 'Medium', cls: 'ww-diff-medium' };
    if (len <= 9) return { label: 'Hard', cls: 'ww-diff-hard' };
    return { label: 'Expert', cls: 'ww-diff-expert' };
  })();

  const flash = useCallback((text, ok) => {
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    setFlashMsg({ text, ok });
    flashTimerRef.current = setTimeout(() => setFlashMsg(null), 1800);
  }, []);

  useEffect(() => () => {
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
  }, []);

  // All-in countdown timer
  useEffect(() => {
    if (!isAllIn || phase !== 'playing' || timeLeft === null) return undefined;

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          setMoney(0);
          setPhase('game-over');
          playTone('lose', settings.soundEnabled);
          onRecordResult?.('wordwager', { won: false, score: peakMoney });
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isAllIn, phase, timeLeft, settings.soundEnabled, onRecordResult, peakMoney]);

  const handleLetter = useCallback(
    (letter) => {
      if (phase !== 'playing' || guessed.has(letter) || !wordObj) return;

      const isHit = wordObj.word.includes(letter);
      let delta = 0;

      if (isAllIn) {
        if (!isHit) delta = -money;
      } else {
        delta = isHit ? effectiveWager : -effectiveWager;
      }

      const newMon = Math.max(0, money + delta);
      const newGues = new Set([...guessed, letter]);

      setGuessed(newGues);
      setMoney(newMon);

      if (isAllIn) {
        if (!isHit) {
          playTone('lose', settings.soundEnabled);
          flash(`✗ "${letter}" not in the word! All-In failed (−$${money})`, false);
        } else {
          playTone('hit', settings.soundEnabled);
          flash(`✓ "${letter}" is in the word!`, true);
        }
      } else {
        playTone(isHit ? 'hit' : 'miss', settings.soundEnabled);
        flash(
          isHit
            ? `✓ "${letter}" is in the word! +$${effectiveWager}`
            : `✗ "${letter}" not in the word! −$${effectiveWager}`,
          isHit
        );
      }

      const wordDone = wordObj.word.split('').every((l) => newGues.has(l));
      if (wordDone) {
        const newCount = wordsCompleted + 1;
        const newUsed = new Set([...usedWords, wordObj.word]);

        let finalMon = newMon;
        if (isAllIn && newMon > 0) {
          finalMon += money;
          setMoney(finalMon);
          flash(`🎉 All-In Success! Double Balance (+$${money})`, true);
        }

        const nextPeak = Math.max(peakMoney, finalMon);
        setPeakMoney(nextPeak);
        setWordsCompleted(newCount);
        setUsedWords(newUsed);
        if (finalMon >= 1000 && wordsAt1k === Infinity) {
          setWordsAt1k(wordsCompleted);
        }
        playTone('win', settings.soundEnabled);
        onRecordResult?.('wordwager', { won: true, score: nextPeak });
        setTimeout(() => setPhase('word-complete'), 550);
        return;
      }

      if (newMon <= 0) {
        playTone('lose', settings.soundEnabled);
        onRecordResult?.('wordwager', { won: false, score: peakMoney });
        setTimeout(() => setPhase('game-over'), 550);
      }
    },
    [
      phase,
      guessed,
      wordObj,
      effectiveWager,
      money,
      wordsCompleted,
      usedWords,
      isAllIn,
      wordsAt1k,
      peakMoney,
      settings.soundEnabled,
      onRecordResult,
      flash,
    ]
  );

  // Allow direct A-Z typing during active play when not focused inside custom wager input
  useEffect(() => {
    if (phase !== 'playing') return undefined;
    const onKeyDown = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (/^[a-zA-Z]$/.test(e.key)) {
        e.preventDefault();
        handleLetter(e.key.toUpperCase());
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [phase, handleLetter]);

  const handleHint = useCallback(() => {
    if (phase !== 'playing' || money < 15 || !wordObj) return;
    const unrevealed = wordObj.word.split('').filter((l) => !guessed.has(l));
    if (unrevealed.length === 0) return;

    const hintLetter = unrevealed[Math.floor(Math.random() * unrevealed.length)];
    const newMon = money - 15;
    const newGues = new Set([...guessed, hintLetter]);

    setGuessed(newGues);
    setMoney(newMon);
    playTone('hit', settings.soundEnabled);
    flash(`💡 Hint: "${hintLetter}" revealed for $15`, true);

    const wordDone = wordObj.word.split('').every((l) => newGues.has(l));
    if (wordDone) {
      const newCount = wordsCompleted + 1;
      const newUsed = new Set([...usedWords, wordObj.word]);
      let finalMon = newMon;
      if (isAllIn && newMon > 0) {
        finalMon += newMon;
        setMoney(finalMon);
        flash(`🎉 All-In Success! Double Balance (+$${newMon})`, true);
      }
      const nextPeak = Math.max(peakMoney, finalMon);
      setPeakMoney(nextPeak);
      setWordsCompleted(newCount);
      setUsedWords(newUsed);
      if (finalMon >= 1000 && wordsAt1k === Infinity) {
        setWordsAt1k(wordsCompleted);
      }
      playTone('win', settings.soundEnabled);
      onRecordResult?.('wordwager', { won: true, score: nextPeak });
      setTimeout(() => setPhase('word-complete'), 550);
    }
  }, [
    phase,
    guessed,
    wordObj,
    money,
    wordsCompleted,
    usedWords,
    isAllIn,
    wordsAt1k,
    peakMoney,
    settings.soundEnabled,
    onRecordResult,
    flash,
  ]);

  const handleContinue = useCallback(() => {
    setRound(initWordRound(dictionary, wordsCompleted, usedWords, money, wordsAt1k));
    setGuessed(new Set());
    setFlashMsg(null);
    setWager((prev) => Math.max(1, Math.min(prev, money)));
    setCustomWager('');
    setIsAllIn(false);
    setTimeLeft(null);
    setPhase('playing');
  }, [dictionary, wordsCompleted, usedWords, money, wordsAt1k]);

  const handlePlayAgain = useCallback(() => {
    const fresh = new Set();
    setMoney(STARTING_MONEY);
    setPeakMoney(STARTING_MONEY);
    setWordsCompleted(0);
    setUsedWords(fresh);
    setRound(initWordRound(dictionary, 0, fresh, STARTING_MONEY, Infinity));
    setGuessed(new Set());
    setFlashMsg(null);
    setWager(10);
    setCustomWager('');
    setWordsAt1k(Infinity);
    setIsAllIn(false);
    setTimeLeft(null);
    setPhase('playing');
  }, [dictionary]);

  if (!wordObj) {
    return (
      <div className="ww-game">
        <div className="ww-header">
          <button type="button" className="btn-exit" onClick={onExit}>← Exit</button>
          <div className="ww-money-display">
            <span className="ww-money-label">💰</span>
            <span className="ww-money-value">${money}</span>
          </div>
        </div>
        <div className="empty-state-box ww-complete-empty">
          <div className="empty-state-icon">🎉</div>
          <div className="empty-state-title">Dictionary Cleared!</div>
          <p className="empty-state-desc">
            You solved all <strong>{wordsCompleted}</strong> words in this deck with a peak balance of <strong>${peakMoney}</strong>!
          </p>
          <ShareResultButton
            title="🐚 Alphabet Cone Snail · Word Wager"
            summary={`Cleared the entire ${wordsCompleted}-word deck with $${money} remaining!`}
            urlHash="wordwager"
          />
          <button type="button" className="btn-primary empty-state-cta" onClick={handlePlayAgain}>
            🔄 Start Fresh Dictionary Run
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ww-game" data-capture-letters={phase === 'playing' ? 'true' : 'false'}>
      {/* Header */}
      <div className="ww-header">
        <button type="button" className="btn-exit" onClick={onExit}>← Exit</button>
        <div className="ww-money-display">
          <span className="ww-money-label">💰</span>
          <span className="ww-money-value">${money}</span>
        </div>
        <div className="ww-header-right">
          <button
            type="button"
            className="ww-hint-btn"
            onClick={handleHint}
            disabled={money < 15 || phase !== 'playing'}
            title="Reveal a random unguessed letter for $15"
          >
            💡 Hint ($15)
          </button>
          <div className="ww-diff-group">
            <span className="ww-word-num">Word #{wordsCompleted + 1}</span>
            <span className={`ww-diff-badge ${diffLabel.cls}`}>{diffLabel.label}</span>
          </div>
        </div>
      </div>

      {/* Flash message */}
      <div className={`ww-flash ${flashMsg ? 'ww-flash-show' : ''} ${flashMsg?.ok ? 'ww-flash-ok' : 'ww-flash-bad'}`}>
        {flashMsg?.text}
      </div>

      {/* Definition */}
      <div className="ww-def-section">
        <div className="ww-def-pos">
          {wordObj.pos}
          {wordObj.region && (
            <span className="ww-def-region">🌍 {wordObj.region}</span>
          )}
        </div>
        <p className="ww-definition">
          {wordTokens.map((tok, i) => (
            <span
              key={i}
              className={tok.isBlank ? 'ww-blank-token' : ''}
              aria-hidden={tok.isBlank ? 'true' : undefined}
            >
              {tok.raw}{' '}
            </span>
          ))}
        </p>
        {blanks > 0 && (
          <div className="ww-blanks-hint">
            ⚠ {blanks} word{blanks > 1 ? 's' : ''} hidden from definition
          </div>
        )}
      </div>

      {/* Word board */}
      <div className="ww-board-section">
        <div className="ww-letter-row">
          {wordObj.word.split('').map((letter, i) => (
            <div key={i} className={`ww-sq ${guessed.has(letter) ? 'ww-sq-revealed' : ''}`}>
              {guessed.has(letter) ? letter : ''}
            </div>
          ))}
        </div>

        {/* Helpful Empty State when no letters guessed yet */}
        {guessed.size === 0 ? (
          <div className="ww-guesses-empty">
            <div className="ww-guesses-empty-copy">
              <span><strong>Guessed letters</strong> appear here — hits in green, misses in red.</span>
              <span className="ww-sample-badges" aria-hidden="true">
                Sample: <span className="ww-gl ww-gl-ok">✓ E</span> <span className="ww-gl ww-gl-bad">✗ Z</span>
              </span>
            </div>
            <button
              type="button"
              className="ww-starter-btn"
              onClick={() => handleLetter('E')}
            >
              ✨ Guess &lsquo;E&rsquo; (Most Common)
            </button>
          </div>
        ) : (
          <div className="ww-guesses-strip">
            {[...correctSet].length > 0 && (
              <div className="ww-guess-group">
                <span className="ww-gl ww-gl-ok">✓</span>
                {[...correctSet].map((l) => (
                  <span key={l} className="ww-gl ww-gl-ok">{l}</span>
                ))}
              </div>
            )}
            {wrongList.length > 0 && (
              <div className="ww-guess-group">
                <span className="ww-gl ww-gl-bad">✗</span>
                {wrongList.map((l) => (
                  <span key={l} className="ww-gl ww-gl-bad">{l}</span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* All In Button */}
      {guessed.size === 0 && phase === 'playing' && !isAllIn && (
        <div className="ww-whole-row">
          <button
            type="button"
            className="ww-whole-btn"
            onClick={() => {
              setIsAllIn(true);
              setTimeLeft(getAllInTimeLimit(wordsCompleted));
            }}
          >
            🎰 GO ALL IN! — Double or Nothing
          </button>
        </div>
      )}

      {/* Wager controls */}
      {!isAllIn ? (
        <div className="ww-wager-section">
          <div className="ww-wager-top">
            <span className="ww-wager-title">Wager per letter</span>
            <span className="ww-wager-math">
              <span className="ww-money-pos">+${effectiveWager}</span> correct &nbsp;|&nbsp;{' '}
              <span className="ww-money-neg">−${effectiveWager}</span> wrong
            </span>
          </div>
          <div className="ww-chips">
            {WAGER_PRESETS.map((amt) => (
              <button
                key={amt}
                type="button"
                className={`ww-chip ${effectiveWager === amt ? 'ww-chip-on' : ''}`}
                onClick={() => {
                  setWager(amt);
                  setCustomWager('');
                }}
                disabled={amt > money}
              >
                ${amt}
              </button>
            ))}
            <button
              type="button"
              className={`ww-chip ww-chip-smart ${effectiveWager === smartWager ? 'ww-chip-on' : ''}`}
              onClick={() => {
                setWager(smartWager);
                setCustomWager('');
              }}
              title="Recommended 20% bankroll wager"
            >
              💡 Smart ${smartWager}
            </button>
            <input
              className="ww-custom-wager"
              type="number"
              min={1}
              max={money}
              placeholder="Custom"
              aria-label="Custom wager amount"
              value={customWager}
              onChange={(e) => {
                setCustomWager(e.target.value);
                const v = parseInt(e.target.value, 10);
                if (!Number.isNaN(v) && v >= 1) setWager(Math.min(v, money));
              }}
            />
          </div>
        </div>
      ) : (
        <div className="ww-wager-section ww-allin-box">
          <div className={`ww-timer ${timeLeft !== null && timeLeft <= 10 ? 'ww-timer-panic' : ''}`}>
            {timeLeft !== null ? timeLeft : ''}
          </div>
          <p className="ww-allin-title">🎰 ALL IN MODE ACTIVE!</p>
          <p className="ww-allin-sub">Any wrong letter ends the run. Complete the word to double your balance!</p>
          <button
            type="button"
            className="ww-cancel-allin-btn"
            onClick={() => {
              setIsAllIn(false);
              setTimeLeft(null);
            }}
          >
            Cancel All-In
          </button>
        </div>
      )}

      {/* Keyboard */}
      <div className="ww-keyboard">
        {KEYBOARD_ROWS.map((row, ri) => (
          <div key={ri} className="ww-key-row">
            {row.split('').map((letter) => {
              const hit = guessed.has(letter) && wordObj.word.includes(letter);
              const miss = guessed.has(letter) && !wordObj.word.includes(letter);
              return (
                <button
                  key={letter}
                  type="button"
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

      {/* Overlays */}
      {phase === 'word-complete' && (
        <WordCompleteOverlay
          word={wordObj.word}
          wordsCompleted={wordsCompleted}
          newMoney={money}
          reducedMotion={settings.reducedMotion}
          onContinue={handleContinue}
        />
      )}

      {phase === 'game-over' && (
        <GameOverOverlay
          money={money}
          peakMoney={peakMoney}
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

const WordWager = ({ settings, onExit, onRecordResult }) => {
  const [phase, setPhase] = useState('menu');
  const [language, setLanguage] = useState(() => settings?.defaultDictionary || 'en-US');

  const selectedLang = DICTIONARIES.find((l) => l.code === language) || DICTIONARIES[0];

  if (phase === 'game') {
    return (
      <Game
        dictionary={selectedLang.dict}
        settings={settings}
        onExit={() => setPhase('menu')}
        onRecordResult={onRecordResult}
      />
    );
  }

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
