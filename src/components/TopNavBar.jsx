import { GAME_BY_KEY } from '../gameCatalog';

const TopNavBar = ({
  currentGame,
  soundEnabled,
  onGoHome,
  onOpenPalette,
  onOpenStats,
  onOpenSettings,
  onOpenShortcuts,
  onToggleSound,
}) => {
  const activeMeta = currentGame ? GAME_BY_KEY[currentGame] : null;

  return (
    <nav className="arcade-topbar" aria-label="Arcade Navigation">
      <div className="topbar-left">
        <button
          type="button"
          className={`topbar-brand ${!currentGame ? 'topbar-brand-active' : ''}`}
          onClick={onGoHome}
          title="Home Catalog (H)"
        >
          <span aria-hidden="true">🐟</span>
          <span className="topbar-brand-text">Trish&apos;s Games</span>
        </button>

        {activeMeta && (
          <span className="topbar-crumb" aria-current="page">
            <span aria-hidden="true">/</span>
            <span>{activeMeta.title}</span>
          </span>
        )}
      </div>

      <div className="topbar-actions">
        <button
          type="button"
          className="topbar-search-btn"
          onClick={onOpenPalette}
          title="Open Command Palette (Ctrl/Cmd+K)"
        >
          <span aria-hidden="true">🔍</span>
          <span className="topbar-search-label">Search &amp; Actions</span>
          <kbd className="topbar-kbd">Ctrl K</kbd>
        </button>

        <button
          type="button"
          className="topbar-icon-btn"
          onClick={onOpenStats}
          title="Scoreboard & Stats (L)"
          aria-label="Open Scoreboard and Stats"
        >
          <span aria-hidden="true">📊</span>
          <span className="topbar-btn-label">Stats</span>
        </button>

        <button
          type="button"
          className="topbar-icon-btn"
          onClick={onOpenSettings}
          title="Settings (S)"
          aria-label="Open Settings"
        >
          <span aria-hidden="true">⚙️</span>
          <span className="topbar-btn-label">Settings</span>
        </button>

        <button
          type="button"
          className="topbar-icon-btn"
          onClick={onToggleSound}
          title={soundEnabled ? 'Mute Sound Effects (M)' : 'Unmute Sound Effects (M)'}
          aria-label={soundEnabled ? 'Mute Sound Effects' : 'Unmute Sound Effects'}
        >
          <span aria-hidden="true">{soundEnabled ? '🔊' : '🔇'}</span>
        </button>

        <button
          type="button"
          className="topbar-icon-btn topbar-help-btn"
          onClick={onOpenShortcuts}
          title="Keyboard Shortcuts (?)"
          aria-label="Keyboard Shortcuts Help"
        >
          ?
        </button>
      </div>
    </nav>
  );
};

export default TopNavBar;
