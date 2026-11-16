/**
 * Local storage helpers for settings, recent games, scoreboard stats,
 * and zero-dependency Web Audio retro feedback tones.
 */

const SETTINGS_KEY = 'trishs_settings_v1';
const RECENT_KEY = 'trishs_recent_v1';
const STATS_KEY = 'trishs_stats_v1';

function detectSystemReducedMotion() {
  try {
    return typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

export function getDefaultSettings() {
  return {
    // Gameplay defaults
    defaultDictionary: 'en-US',
    defaultBrickGrid: 8,
    defaultRiverSize: 'stream',
    confirmOnExit: true,
    // Audio & Visuals
    soundEnabled: true,
    reducedMotion: detectSystemReducedMotion(),
    highContrast: false,
    // Keyboard & Navigation
    shortcutsEnabled: true,
  };
}

export const SETTINGS_META = {
  defaultDictionary: {
    label: 'Word Wager Dictionary',
    format: (v) => (v === 'world-english' ? 'World & Regional English' : 'American English'),
  },
  defaultBrickGrid: {
    label: 'BrickSmack Grid Size',
    format: (v) => `${v}×${v}`,
  },
  defaultRiverSize: {
    label: 'River Default Scale',
    format: (v) => ({ stream: 'Stream (16×16)', river: 'River (32×32)', flood: 'Flood (64×64)' }[v] || v),
  },
  confirmOnExit: {
    label: 'Confirm Exit Mid-Game',
    format: (v) => (v ? 'On' : 'Off'),
  },
  soundEnabled: {
    label: 'Sound Effects',
    format: (v) => (v ? 'On' : 'Off'),
  },
  reducedMotion: {
    label: 'Reduced Motion',
    format: (v) => (v ? 'On' : 'Off'),
  },
  highContrast: {
    label: 'High-Contrast Boards',
    format: (v) => (v ? 'On' : 'Off'),
  },
  shortcutsEnabled: {
    label: 'Keyboard Shortcuts',
    format: (v) => (v ? 'Enabled' : 'Disabled'),
  },
};

export function loadSettings() {
  const defaults = getDefaultSettings();
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    return { ...defaults, ...parsed };
  } catch {
    return defaults;
  }
}

export function saveSettings(nextSettings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(nextSettings));
  } catch {
    // Ignore storage quota or privacy-mode errors
  }
}

export function diffSettings(prev, next) {
  const changes = [];
  for (const key of Object.keys(SETTINGS_META)) {
    if (prev[key] !== next[key]) {
      const meta = SETTINGS_META[key];
      changes.push(`${meta.label}: ${meta.format(prev[key])} → ${meta.format(next[key])}`);
    }
  }
  return changes;
}

export function loadRecentGames() {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function recordRecentGame(gameKey) {
  try {
    const prev = loadRecentGames().filter((item) => item.key !== gameKey);
    const next = [{ key: gameKey, timestamp: Date.now() }, ...prev].slice(0, 6);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    return next;
  } catch {
    return [];
  }
}

export function loadStats() {
  let stats;
  try {
    const raw = localStorage.getItem(STATS_KEY);
    stats = raw ? JSON.parse(raw) : {};
  } catch {
    stats = {};
  }

  // Sync legacy BrickSmack high scores if present in localStorage
  try {
    let legacyMax = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('bricksmack_highscore_')) {
        const val = parseInt(localStorage.getItem(k) || '0', 10);
        if (val > legacyMax) legacyMax = val;
      }
    }
    if (legacyMax > 0) {
      const bs = stats.bricksmack || { played: 0, wins: 0, bestScore: 0 };
      if (legacyMax > (bs.bestScore || 0)) {
        stats.bricksmack = { ...bs, bestScore: legacyMax, played: Math.max(bs.played || 0, 1) };
      }
    }
  } catch {
    // Ignore storage errors
  }

  return stats;
}

export function recordGameResult(gameKey, { won = false, score = null } = {}) {
  const stats = loadStats();
  const prev = stats[gameKey] || { played: 0, wins: 0, bestScore: null, lastPlayed: null };
  const nextBest =
    score === null
      ? prev.bestScore
      : prev.bestScore === null
        ? score
        : Math.max(prev.bestScore, score);

  const updated = {
    ...stats,
    [gameKey]: {
      played: (prev.played || 0) + 1,
      wins: (prev.wins || 0) + (won ? 1 : 0),
      bestScore: nextBest,
      lastPlayed: Date.now(),
    },
  };
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage errors
  }
  return updated;
}

export function clearAllArcadeData() {
  try {
    localStorage.removeItem(SETTINGS_KEY);
    localStorage.removeItem(RECENT_KEY);
    localStorage.removeItem(STATS_KEY);
    const keysToDelete = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('bricksmack_highscore_')) keysToDelete.push(k);
    }
    for (const k of keysToDelete) localStorage.removeItem(k);
  } catch {
    // Ignore storage errors
  }
}

let audioCtx = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) audioCtx = new Ctx();
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Play a short synthesized Web Audio tone if sound effects are enabled.
 * @param {'click'|'hit'|'miss'|'win'|'lose'} kind
 * @param {boolean} enabled
 */
export function playTone(kind, enabled = true) {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const playNote = (freq, startOffset, duration, type = 'sine', gainVal = 0.06) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now + startOffset);
    gain.gain.setValueAtTime(gainVal, now + startOffset);
    gain.gain.exponentialRampToValueAtTime(0.001, now + startOffset + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + startOffset);
    osc.stop(now + startOffset + duration);
  };

  try {
    if (kind === 'click') {
      playNote(520, 0, 0.05, 'triangle', 0.04);
    } else if (kind === 'hit') {
      playNote(587.33, 0, 0.08, 'sine', 0.06);
      playNote(783.99, 0.06, 0.12, 'sine', 0.06);
    } else if (kind === 'miss') {
      playNote(220, 0, 0.14, 'sawtooth', 0.035);
    } else if (kind === 'win') {
      playNote(523.25, 0, 0.12, 'triangle', 0.07);
      playNote(659.25, 0.09, 0.12, 'triangle', 0.07);
      playNote(783.99, 0.18, 0.14, 'triangle', 0.07);
      playNote(1046.5, 0.28, 0.28, 'triangle', 0.08);
    } else if (kind === 'lose') {
      playNote(330, 0, 0.15, 'triangle', 0.05);
      playNote(261.63, 0.14, 0.25, 'triangle', 0.05);
    }
  } catch {
    // Ignore Web Audio errors on restricted autoplay environments
  }
}
