const SHORTCUT_ITEMS = [
  { keys: 'Ctrl / ⌘ + K', action: 'Open Command Palette (search games, pages & actions)' },
  { keys: '?', action: 'Show or hide this Keyboard Shortcuts overlay' },
  { keys: 'H', action: "Go to Arcade Home Catalog" },
  { keys: '1 – 6', action: 'Launch Game 1–6 (BrickSmack, River, Mind, Tactics, Wager, Four)' },
  { keys: 'R', action: 'Restart or start a fresh round in the current game' },
  { keys: 'S', action: 'Open Arcade Settings' },
  { keys: 'L', action: 'Open Scoreboard & Stats' },
  { keys: 'M', action: 'Mute or unmute sound effects' },
  { keys: 'G', action: 'Surprise Me — jump to a random game' },
  { keys: 'Esc', action: 'Close open dialog or step back to menu' },
];

const ShortcutsModal = ({ open, onClose, shortcutsEnabled }) => {
  if (!open) return null;

  return (
    <div
      className="arcade-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard Shortcuts"
      onClick={onClose}
    >
      <div className="arcade-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="arcade-modal-header">
          <div>
            <h2 className="arcade-modal-title">⌨️ Keyboard Shortcuts</h2>
            <p className="arcade-modal-sub">
              {shortcutsEnabled
                ? 'Active across all screens. Single-key shortcuts automatically pause while typing inside text fields.'
                : 'Single-key shortcuts are currently paused in Settings (Ctrl/Cmd+K and ? still work).'}
            </p>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close shortcuts">
            ✕
          </button>
        </div>

        <div className="shortcuts-grid">
          {SHORTCUT_ITEMS.map((item) => (
            <div key={item.keys} className="shortcut-row">
              <kbd className="shortcut-kbd">{item.keys}</kbd>
              <span className="shortcut-desc">{item.action}</span>
            </div>
          ))}
        </div>

        <div className="arcade-modal-footer">
          <span className="modal-tip">In-game keys: Space rotates in BrickSmack &amp; Fleet Tactics; A–Z types in Word Wager.</span>
          <button type="button" className="btn-primary modal-done-btn" onClick={onClose}>
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShortcutsModal;
