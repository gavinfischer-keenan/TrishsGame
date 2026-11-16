import { useState, useEffect, useCallback } from 'react';
import { resolveGame } from './gameRoutes.js';
import { GAMES_CATALOG, GAME_BY_KEY } from './gameCatalog.js';
import {
  loadSettings,
  saveSettings,
  loadRecentGames,
  recordRecentGame,
  loadStats,
  recordGameResult,
  clearAllArcadeData,
  playTone,
} from './utils/storage.js';
import TopNavBar from './components/TopNavBar';
import CommandPalette from './components/CommandPalette';
import ShortcutsModal from './components/ShortcutsModal';
import SettingsModal from './components/SettingsModal';
import StatsModal from './components/StatsModal';
import HomeScreen from './components/HomeScreen';
import BrickSmack from './games/bricksmack/BrickSmack';
import BuildMeARiver from './games/buildmeariver/BuildMeARiver';
import SlippedMyMind from './games/slippedmymind/SlippedMyMind';
import Archerfish from './games/archerfish/Archerfish';
import WordWager from './games/wordwager/WordWager';
import ClownTriggerfish from './games/clowntriggerfish/ClownTriggerfish';

function getGameFromHash() {
  return resolveGame(window.location.hash);
}

function isEditableTarget(target) {
  if (!target) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (target.isContentEditable) return true;
  return Boolean(target.closest && target.closest('input, textarea, select, [contenteditable="true"]'));
}

function App() {
  const [currentGame, setCurrentGame] = useState(() => getGameFromHash());
  const [gameInstanceKey, setGameInstanceKey] = useState(0);
  const [settings, setSettings] = useState(() => loadSettings());
  const [recentGames, setRecentGames] = useState(() => loadRecentGames());
  const [stats, setStats] = useState(() => loadStats());

  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [confirmLeaveOpen, setConfirmLeaveOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((msg) => {
    setToast(msg);
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  // Sync URL hash changes (back/forward or manual hash edits)
  useEffect(() => {
    const onHashChange = () => {
      const next = getGameFromHash();
      setCurrentGame(next);
      if (next) {
        setRecentGames(recordRecentGame(next));
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Apply root accessibility classes (reducedMotion & highContrast)
  const rootClassName = [
    'app-root',
    settings.reducedMotion ? 'pref-reduced-motion' : '',
    settings.highContrast ? 'pref-high-contrast' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const navigateHomeImmediate = useCallback(() => {
    setConfirmLeaveOpen(false);
    history.pushState('', document.title, window.location.pathname + window.location.search);
    setCurrentGame(null);
    window.scrollTo(0, 0);
  }, []);

  const requestGoHome = useCallback(() => {
    if (currentGame && settings.confirmOnExit) {
      setConfirmLeaveOpen(true);
      return;
    }
    navigateHomeImmediate();
  }, [currentGame, settings.confirmOnExit, navigateHomeImmediate]);

  const handleSelectGame = useCallback(
    (gameKey) => {
      if (!GAME_BY_KEY[gameKey]) return;
      playTone('click', settings.soundEnabled);
      setConfirmLeaveOpen(false);
      window.location.hash = gameKey;
      setCurrentGame(gameKey);
      setGameInstanceKey((k) => k + 1);
      setRecentGames(recordRecentGame(gameKey));
      window.scrollTo(0, 0);
    },
    [settings.soundEnabled]
  );

  const handleRestartCurrentGame = useCallback(() => {
    if (!currentGame) return;
    setGameInstanceKey((k) => k + 1);
    showToast(`↺ Restarted ${GAME_BY_KEY[currentGame]?.title || 'game'}`);
  }, [currentGame, showToast]);

  const handleSurpriseMe = useCallback(() => {
    const pool = GAMES_CATALOG.filter((g) => g.key !== currentGame);
    const picked = pool[Math.floor(Math.random() * pool.length)] || GAMES_CATALOG[0];
    handleSelectGame(picked.key);
    showToast(`🎲 Surprise pick: ${picked.title}!`);
  }, [currentGame, handleSelectGame, showToast]);

  const handleToggleSetting = useCallback(
    (key) => {
      setSettings((prev) => {
        const next = { ...prev, [key]: !prev[key] };
        saveSettings(next);
        if (key === 'soundEnabled') {
          showToast(next.soundEnabled ? '🔊 Sound effects enabled' : '🔇 Sound effects muted');
        } else if (key === 'highContrast') {
          showToast(next.highContrast ? '◐ High-contrast boards enabled' : '◐ High-contrast boards off');
        } else if (key === 'reducedMotion') {
          showToast(next.reducedMotion ? '🎞️ Reduced motion enabled' : '🎞️ Normal animations enabled');
        }
        return next;
      });
    },
    [showToast]
  );

  const handleSaveSettings = useCallback((nextSettings) => {
    setSettings(nextSettings);
    saveSettings(nextSettings);
  }, []);

  const handleResetAllData = useCallback(() => {
    clearAllArcadeData();
    const fresh = loadSettings();
    setSettings(fresh);
    setRecentGames([]);
    setStats({});
  }, []);

  const handleRecordResult = useCallback((gameKey, result) => {
    setStats(recordGameResult(gameKey, result));
  }, []);

  const handleCopyCurrentUrl = useCallback(async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      showToast('🔗 Link copied to clipboard!');
    } catch {
      showToast(`🔗 Share URL: ${url}`);
    }
  }, [showToast]);

  const closeAllOverlays = useCallback(() => {
    setPaletteOpen(false);
    setShortcutsOpen(false);
    setSettingsOpen(false);
    setStatsOpen(false);
    setConfirmLeaveOpen(false);
  }, []);

  // Global keyboard shortcuts (Cmd/Ctrl+K, ?, H, 1-6, R, S, L, M, G, Esc)
  useEffect(() => {
    const onKeyDown = (e) => {
      const mod = e.metaKey || e.ctrlKey;

      // Cmd/Ctrl + K opens Command Palette everywhere
      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShortcutsOpen(false);
        setSettingsOpen(false);
        setStatsOpen(false);
        setConfirmLeaveOpen(false);
        setPaletteOpen((o) => !o);
        return;
      }

      // Escape closes overlays or exits active game
      if (e.key === 'Escape') {
        if (paletteOpen || shortcutsOpen || settingsOpen || statsOpen || confirmLeaveOpen) {
          e.preventDefault();
          closeAllOverlays();
          return;
        }
        if (currentGame) {
          e.preventDefault();
          requestGoHome();
        }
        return;
      }

      // Never trigger single-key shortcuts while typing inside inputs/textareas/selects
      if (isEditableTarget(e.target)) return;

      // '?' opens Shortcuts Overlay
      if (e.key === '?' && !mod && !e.altKey) {
        e.preventDefault();
        setPaletteOpen(false);
        setSettingsOpen(false);
        setStatsOpen(false);
        setShortcutsOpen((o) => !o);
        return;
      }

      if (!settings.shortcutsEnabled || mod || e.altKey) return;
      if (paletteOpen || shortcutsOpen || settingsOpen || statsOpen || confirmLeaveOpen) return;

      // During Word Wager active letter-guessing round, let A-Z type guesses uninterrupted
      const letterGameActive = Boolean(document.querySelector('[data-capture-letters="true"]'));
      const lower = e.key.toLowerCase();

      if (/^[1-6]$/.test(e.key)) {
        const game = GAMES_CATALOG[Number(e.key) - 1];
        if (game) {
          e.preventDefault();
          handleSelectGame(game.key);
        }
        return;
      }

      if (letterGameActive) return;

      if (lower === 'h') {
        e.preventDefault();
        requestGoHome();
      } else if (lower === 'r' && currentGame) {
        e.preventDefault();
        handleRestartCurrentGame();
      } else if (lower === 's') {
        e.preventDefault();
        setSettingsOpen(true);
      } else if (lower === 'l') {
        e.preventDefault();
        setStatsOpen(true);
      } else if (lower === 'm') {
        e.preventDefault();
        handleToggleSetting('soundEnabled');
      } else if (lower === 'g') {
        e.preventDefault();
        handleSurpriseMe();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    paletteOpen,
    shortcutsOpen,
    settingsOpen,
    statsOpen,
    confirmLeaveOpen,
    currentGame,
    settings.shortcutsEnabled,
    closeAllOverlays,
    requestGoHome,
    handleSelectGame,
    handleRestartCurrentGame,
    handleToggleSetting,
    handleSurpriseMe,
  ]);

  const gameSharedProps = {
    settings,
    onExit: navigateHomeImmediate,
    onRecordResult: handleRecordResult,
  };

  return (
    <div className={rootClassName}>
      <TopNavBar
        currentGame={currentGame}
        soundEnabled={settings.soundEnabled}
        onGoHome={requestGoHome}
        onOpenPalette={() => {
          closeAllOverlays();
          setPaletteOpen(true);
        }}
        onOpenStats={() => {
          closeAllOverlays();
          setStatsOpen(true);
        }}
        onOpenSettings={() => {
          closeAllOverlays();
          setSettingsOpen(true);
        }}
        onOpenShortcuts={() => {
          closeAllOverlays();
          setShortcutsOpen(true);
        }}
        onToggleSound={() => handleToggleSetting('soundEnabled')}
      />

      {toast && (
        <div className="arcade-toast" role="status" aria-live="polite">
          {toast}
        </div>
      )}

      <main className="arcade-stage">
        {currentGame === 'bricksmack' && (
          <BrickSmack key={`bricksmack-${gameInstanceKey}`} {...gameSharedProps} />
        )}
        {currentGame === 'buildmeariver' && (
          <BuildMeARiver key={`river-${gameInstanceKey}`} {...gameSharedProps} />
        )}
        {currentGame === 'slippedmymind' && (
          <SlippedMyMind key={`mind-${gameInstanceKey}`} {...gameSharedProps} />
        )}
        {currentGame === 'archerfish' && (
          <Archerfish key={`archerfish-${gameInstanceKey}`} {...gameSharedProps} />
        )}
        {currentGame === 'wordwager' && (
          <WordWager key={`wordwager-${gameInstanceKey}`} {...gameSharedProps} />
        )}
        {currentGame === 'clowntriggerfish' && (
          <ClownTriggerfish key={`clown-${gameInstanceKey}`} {...gameSharedProps} />
        )}
        {!currentGame && (
          <HomeScreen
            stats={stats}
            recentGames={recentGames}
            onSelectGame={handleSelectGame}
            onSurpriseMe={handleSurpriseMe}
            onOpenPalette={() => setPaletteOpen(true)}
          />
        )}
      </main>

      {paletteOpen && (
        <CommandPalette
          currentGame={currentGame}
          recentGames={recentGames}
          settings={settings}
          onClose={() => setPaletteOpen(false)}
          onNavigateHome={navigateHomeImmediate}
          onSelectGame={handleSelectGame}
          onRestartCurrentGame={handleRestartCurrentGame}
          onSurpriseMe={handleSurpriseMe}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenStats={() => setStatsOpen(true)}
          onOpenShortcuts={() => setShortcutsOpen(true)}
          onToggleSetting={handleToggleSetting}
          onCopyCurrentUrl={handleCopyCurrentUrl}
        />
      )}

      <ShortcutsModal
        open={shortcutsOpen}
        shortcutsEnabled={settings.shortcutsEnabled}
        onClose={() => setShortcutsOpen(false)}
      />

      {settingsOpen && (
        <SettingsModal
          settings={settings}
          onSave={handleSaveSettings}
          onResetData={handleResetAllData}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      <StatsModal
        open={statsOpen}
        stats={stats}
        onPlayGame={handleSelectGame}
        onClose={() => setStatsOpen(false)}
      />

      {confirmLeaveOpen && (
        <div
          className="arcade-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="Confirm Leave Game"
          onClick={() => setConfirmLeaveOpen(false)}
        >
          <div className="overlay-card confirm-exit-card" onClick={(e) => e.stopPropagation()}>
            <div className="overlay-icon" aria-hidden="true">🧭</div>
            <h2>Leave {GAME_BY_KEY[currentGame]?.title || 'Current Game'}?</h2>
            <p>Your in-progress round won&apos;t be saved, though high scores already recorded are safe.</p>
            <div className="overlay-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setConfirmLeaveOpen(false)}
              >
                Keep Playing
              </button>
              <button type="button" className="btn-primary" onClick={navigateHomeImmediate}>
                Back to Catalog
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
