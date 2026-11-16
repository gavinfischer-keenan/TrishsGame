import { useState, useEffect, useRef, useMemo } from 'react';
import { GAMES_CATALOG, GAME_BY_KEY } from '../gameCatalog';

const SAMPLE_QUERIES = ['BrickSmack', 'Word Wager', 'Stats', 'Mute', 'Settings'];

const CommandPalette = ({
  currentGame,
  recentGames,
  settings,
  onClose,
  onNavigateHome,
  onSelectGame,
  onRestartCurrentGame,
  onSurpriseMe,
  onOpenSettings,
  onOpenStats,
  onOpenShortcuts,
  onToggleSetting,
  onCopyCurrentUrl,
}) => {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => {
      inputRef.current?.focus();
    }, 10);
    return () => clearTimeout(t);
  }, []);

  const items = useMemo(() => {
    const list = [];

    // Recent items
    for (const r of recentGames) {
      const g = GAME_BY_KEY[r.key];
      if (!g) continue;
      list.push({
        id: `recent-${g.key}`,
        group: 'Recent',
        icon: g.icon,
        label: `Resume ${g.title}`,
        hint: `${g.animal} · Recently opened`,
        keywords: `${g.title} ${g.animal} recent resume`,
        run: () => onSelectGame(g.key),
      });
    }

    // Pages & Games
    list.push({
      id: 'page-home',
      group: 'Pages',
      icon: '🏠',
      label: 'Arcade Home Catalog',
      hint: 'View all six games',
      shortcut: 'H',
      keywords: 'home catalog index main menu',
      run: onNavigateHome,
    });

    for (const g of GAMES_CATALOG) {
      list.push({
        id: `game-${g.key}`,
        group: 'Games',
        icon: g.icon,
        label: g.title,
        hint: `${g.animal} — ${g.subtitle}`,
        shortcut: g.shortcut,
        keywords: `${g.title} ${g.animal} ${g.key} ${g.subtitle}`,
        run: () => onSelectGame(g.key),
      });
    }

    list.push({
      id: 'page-stats',
      group: 'Pages',
      icon: '📊',
      label: 'Scoreboard & Stats',
      hint: 'Personal bests and play counts',
      shortcut: 'L',
      keywords: 'stats leaderboard scoreboard high scores history',
      run: onOpenStats,
    });

    list.push({
      id: 'page-settings',
      group: 'Pages',
      icon: '⚙️',
      label: 'Arcade Settings',
      hint: 'Gameplay defaults, audio, and accessibility',
      shortcut: 'S',
      keywords: 'settings preferences audio sound contrast motion dictionary',
      run: onOpenSettings,
    });

    // Actions
    if (currentGame && GAME_BY_KEY[currentGame]) {
      list.push({
        id: 'action-restart',
        group: 'Actions',
        icon: '↺',
        label: `Restart ${GAME_BY_KEY[currentGame].title}`,
        hint: 'Reset current game session',
        shortcut: 'R',
        keywords: 'restart reset reload new game',
        run: onRestartCurrentGame,
      });
    }

    list.push({
      id: 'action-surprise',
      group: 'Actions',
      icon: '🎲',
      label: 'Surprise Me (Random Game)',
      hint: 'Jump straight into a random game',
      shortcut: 'G',
      keywords: 'random surprise pick lucky',
      run: onSurpriseMe,
    });

    list.push({
      id: 'action-sound',
      group: 'Actions',
      icon: settings.soundEnabled ? '🔇' : '🔊',
      label: settings.soundEnabled ? 'Mute Sound Effects' : 'Unmute Sound Effects',
      hint: `Currently ${settings.soundEnabled ? 'On' : 'Off'}`,
      shortcut: 'M',
      keywords: 'sound audio mute unmute volume',
      run: () => onToggleSetting('soundEnabled'),
    });

    list.push({
      id: 'action-contrast',
      group: 'Actions',
      icon: '◐',
      label: settings.highContrast ? 'Disable High-Contrast Boards' : 'Enable High-Contrast Boards',
      hint: `Currently ${settings.highContrast ? 'On' : 'Off'}`,
      keywords: 'contrast accessibility borders visibility',
      run: () => onToggleSetting('highContrast'),
    });

    list.push({
      id: 'action-motion',
      group: 'Actions',
      icon: '🎞️',
      label: settings.reducedMotion ? 'Allow Animations' : 'Enable Reduced Motion',
      hint: `Currently ${settings.reducedMotion ? 'Reduced' : 'Normal'}`,
      keywords: 'motion animations confetti reduce accessibility',
      run: () => onToggleSetting('reducedMotion'),
    });

    list.push({
      id: 'action-shortcuts',
      group: 'Actions',
      icon: '⌨️',
      label: 'Show Keyboard Shortcuts',
      hint: 'View all 10 quick keys',
      shortcut: '?',
      keywords: 'keyboard shortcuts keys help overlay',
      run: onOpenShortcuts,
    });

    list.push({
      id: 'action-share-link',
      group: 'Actions',
      icon: '🔗',
      label: 'Copy Direct Link to Current Screen',
      hint: currentGame ? `/#${currentGame}` : 'Catalog homepage',
      keywords: 'copy link share url bookmark',
      run: onCopyCurrentUrl,
    });

    for (const g of GAMES_CATALOG) {
      list.push({
        id: `about-${g.key}`,
        group: 'Animal Profiles',
        icon: '🐚',
        label: `About ${g.animal}`,
        hint: `Natural history behind ${g.title}`,
        keywords: `about animal profile biology ${g.animal} ${g.title}`,
        run: () => {
          window.location.href = g.aboutUrl;
        },
      });
    }

    return list;
  }, [
    recentGames,
    currentGame,
    settings.soundEnabled,
    settings.highContrast,
    settings.reducedMotion,
    onSelectGame,
    onNavigateHome,
    onOpenStats,
    onOpenSettings,
    onRestartCurrentGame,
    onSurpriseMe,
    onToggleSetting,
    onOpenShortcuts,
    onCopyCurrentUrl,
  ]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.hint.toLowerCase().includes(q) ||
        item.group.toLowerCase().includes(q) ||
        item.keywords.toLowerCase().includes(q)
    );
  }, [items, query]);

  const clampedIdx = filtered.length > 0 ? Math.min(activeIndex, filtered.length - 1) : 0;

  const executeItem = (item) => {
    onClose();
    setQuery('');
    setActiveIndex(0);
    item.run();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (filtered.length > 0) setActiveIndex((i) => (i + 1) % filtered.length);
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (filtered.length > 0) setActiveIndex((i) => (i - 1 + filtered.length) % filtered.length);
      return;
    }
    if (e.key === 'Enter' && filtered[clampedIdx]) {
      e.preventDefault();
      executeItem(filtered[clampedIdx]);
    }
  };

  return (
    <div
      className="arcade-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
      onClick={onClose}
    >
      <div className="palette-card" onClick={(e) => e.stopPropagation()} onKeyDown={handleKeyDown}>
        <div className="palette-input-row">
          <span className="palette-search-icon" aria-hidden="true">🔍</span>
          <input
            ref={inputRef}
            type="text"
            className="palette-input"
            placeholder="Search games, pages, recent items, or quick actions…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            aria-label="Search commands"
          />
          {query && (
            <button
              type="button"
              className="palette-clear-btn"
              onClick={() => {
                setQuery('');
                setActiveIndex(0);
                inputRef.current?.focus();
              }}
            >
              Clear
            </button>
          )}
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close palette">
            ✕
          </button>
        </div>

        <div className="palette-results" role="listbox">
          {recentGames.length === 0 && !query.trim() && (
            <div className="palette-recent-empty">
              <span><strong>Recent items:</strong> Games you play appear here for quick resuming.</span>
              <button
                type="button"
                className="palette-mini-action"
                onClick={() => executeItem(items.find((i) => i.id === 'game-bricksmack'))}
              >
                Try BrickSmack →
              </button>
            </div>
          )}

          {filtered.length > 0 ? (
            filtered.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                role="option"
                aria-selected={idx === clampedIdx}
                className={`palette-item ${idx === clampedIdx ? 'palette-item-active' : ''}`}
                onMouseEnter={() => setActiveIndex(idx)}
                onClick={() => executeItem(item)}
              >
                <span className="palette-item-icon" aria-hidden="true">{item.icon}</span>
                <span className="palette-item-body">
                  <span className="palette-item-title">{item.label}</span>
                  <span className="palette-item-hint">{item.hint}</span>
                </span>
                <span className="palette-item-meta">
                  <span className="palette-item-group">{item.group}</span>
                  {item.shortcut && <kbd className="palette-item-kbd">{item.shortcut}</kbd>}
                </span>
              </button>
            ))
          ) : (
            <div className="empty-state-box palette-empty">
              <div className="empty-state-title">No matching games or commands for &ldquo;{query}&rdquo;</div>
              <p className="empty-state-desc">
                The Command Palette searches all 6 games, animal profiles, recent rounds, settings, and quick actions.
              </p>
              <button
                type="button"
                className="btn-primary empty-state-cta"
                onClick={() => {
                  setQuery('');
                  setActiveIndex(0);
                  inputRef.current?.focus();
                }}
              >
                Clear Search &amp; Show All
              </button>
              <div className="empty-state-samples">
                <span className="empty-state-sample-label">Try a sample:</span>
                {SAMPLE_QUERIES.map((sample) => (
                  <button
                    key={sample}
                    type="button"
                    className="sample-chip-btn"
                    onClick={() => {
                      setQuery(sample);
                      setActiveIndex(0);
                      inputRef.current?.focus();
                    }}
                  >
                    {sample}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="palette-footer">
          <span><kbd>↑</kbd> <kbd>↓</kbd> Navigate</span>
          <span><kbd>Enter</kbd> Run</span>
          <span><kbd>Esc</kbd> Close</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
