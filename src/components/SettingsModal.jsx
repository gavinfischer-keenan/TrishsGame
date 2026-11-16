import { useState } from 'react';
import { getDefaultSettings, diffSettings } from '../utils/storage';

const SettingsModal = ({ settings, onSave, onResetData, onClose }) => {
  const [draft, setDraft] = useState(settings);
  const [confirmation, setConfirmation] = useState(null);

  const update = (key, value) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setConfirmation(null);
  };

  const handleSave = (e) => {
    e.preventDefault();
    const changes = diffSettings(settings, draft);
    onSave(draft);
    setConfirmation({
      count: changes.length,
      items: changes,
    });
  };

  const handleRestoreDefaults = () => {
    const defaults = getDefaultSettings();
    const changes = diffSettings(settings, defaults);
    setDraft(defaults);
    onSave(defaults);
    setConfirmation({
      count: changes.length,
      items: changes.length > 0 ? changes : ['All settings already match recommended defaults.'],
    });
  };

  return (
    <div
      className="arcade-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Arcade Settings"
      onClick={onClose}
    >
      <div className="arcade-modal-card settings-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="arcade-modal-header">
          <div>
            <h2 className="arcade-modal-title">⚙️ Arcade Settings</h2>
            <p className="arcade-modal-sub">
              Personalize game defaults, audio feedback, and accessibility. Saved locally on your device.
            </p>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close settings">
            ✕
          </button>
        </div>

        {confirmation && (
          <div className="settings-save-banner" role="status" aria-live="polite">
            <div className="settings-save-title">
              ✓ {confirmation.count > 0
                ? `Saved ${confirmation.count} setting ${confirmation.count === 1 ? 'change' : 'changes'}:`
                : 'Settings saved (no changes from previous values).'}
            </div>
            {confirmation.items.length > 0 && (
              <ul className="settings-diff-list">
                {confirmation.items.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <form onSubmit={handleSave} className="settings-form">
          {/* Group 1: Gameplay Defaults */}
          <fieldset className="settings-group">
            <legend className="settings-group-title">🎮 Gameplay Defaults</legend>

            <div className="setting-row">
              <div className="setting-info">
                <label htmlFor="set-dict" className="setting-label">Word Wager Default Dictionary</label>
                <p className="setting-desc">Vocabulary deck pre-selected when opening Word Wager. Default: American English.</p>
              </div>
              <select
                id="set-dict"
                className="setting-select"
                value={draft.defaultDictionary}
                onChange={(e) => update('defaultDictionary', e.target.value)}
              >
                <option value="en-US">American English</option>
                <option value="world-english">World &amp; Regional English</option>
              </select>
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <label htmlFor="set-brick" className="setting-label">BrickSmack Starting Grid</label>
                <p className="setting-desc">Default board dimensions on the BrickSmack launch screen. Default: 8×8.</p>
              </div>
              <select
                id="set-brick"
                className="setting-select"
                value={draft.defaultBrickGrid}
                onChange={(e) => update('defaultBrickGrid', Number(e.target.value))}
              >
                <option value={8}>8×8 (Classic)</option>
                <option value={16}>16×16 (Marathon)</option>
              </select>
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <label htmlFor="set-river" className="setting-label">Build Me a River Scale</label>
                <p className="setting-desc">Default river map size selected in Level Select. Default: Stream (16×16).</p>
              </div>
              <select
                id="set-river"
                className="setting-select"
                value={draft.defaultRiverSize}
                onChange={(e) => update('defaultRiverSize', e.target.value)}
              >
                <option value="stream">Stream (16×16)</option>
                <option value="river">River (32×32)</option>
                <option value="flood">Flood (64×64)</option>
              </select>
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <label htmlFor="set-confirm" className="setting-label">Confirm Before Leaving Active Game</label>
                <p className="setting-desc">Ask before navigating away with top-bar links while a game is open. Default: On.</p>
              </div>
              <input
                id="set-confirm"
                type="checkbox"
                className="setting-toggle"
                checked={draft.confirmOnExit}
                onChange={(e) => update('confirmOnExit', e.target.checked)}
              />
            </div>
          </fieldset>

          {/* Group 2: Audio & Visuals */}
          <fieldset className="settings-group">
            <legend className="settings-group-title">✨ Audio &amp; Accessibility</legend>

            <div className="setting-row">
              <div className="setting-info">
                <label htmlFor="set-sound" className="setting-label">Arcade Sound Effects</label>
                <p className="setting-desc">Synthesized local Web Audio cues for hits, misses, and victories. Default: On.</p>
              </div>
              <input
                id="set-sound"
                type="checkbox"
                className="setting-toggle"
                checked={draft.soundEnabled}
                onChange={(e) => update('soundEnabled', e.target.checked)}
              />
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <label htmlFor="set-motion" className="setting-label">Reduced Motion</label>
                <p className="setting-desc">Disables celebration confetti and minimizes animations across games. Default: Matches OS.</p>
              </div>
              <input
                id="set-motion"
                type="checkbox"
                className="setting-toggle"
                checked={draft.reducedMotion}
                onChange={(e) => update('reducedMotion', e.target.checked)}
              />
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <label htmlFor="set-contrast" className="setting-label">High-Contrast Game Boards</label>
                <p className="setting-desc">Strengthens cell borders, grid lines, and feedback pegs for clarity. Default: Off.</p>
              </div>
              <input
                id="set-contrast"
                type="checkbox"
                className="setting-toggle"
                checked={draft.highContrast}
                onChange={(e) => update('highContrast', e.target.checked)}
              />
            </div>
          </fieldset>

          {/* Group 3: Keyboard & Navigation */}
          <fieldset className="settings-group">
            <legend className="settings-group-title">⌨️ Keyboard &amp; Navigation</legend>

            <div className="setting-row">
              <div className="setting-info">
                <label htmlFor="set-keys" className="setting-label">Enable Single-Key Shortcuts</label>
                <p className="setting-desc">Allows H, R, S, L, M, G, and 1–6 shortcuts outside text inputs. Default: On.</p>
              </div>
              <input
                id="set-keys"
                type="checkbox"
                className="setting-toggle"
                checked={draft.shortcutsEnabled}
                onChange={(e) => update('shortcutsEnabled', e.target.checked)}
              />
            </div>
          </fieldset>

          {/* Collapsed rare/advanced section */}
          <details className="settings-advanced">
            <summary className="settings-advanced-summary">Advanced Data Management</summary>
            <div className="settings-advanced-body">
              <p className="setting-desc">
                Restore recommended defaults or erase all locally stored high scores, recent history, and stats.
              </p>
              <div className="settings-advanced-actions">
                <button type="button" className="btn-secondary" onClick={handleRestoreDefaults}>
                  Restore Defaults
                </button>
                <button
                  type="button"
                  className="btn-danger-outline"
                  onClick={() => {
                    onResetData();
                    setDraft(getDefaultSettings());
                    setConfirmation({
                      count: 1,
                      items: ['Cleared all local high scores, recent history, and restored default settings.'],
                    });
                  }}
                >
                  Clear Local Scores &amp; History
                </button>
              </div>
            </div>
          </details>

          <div className="arcade-modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Close
            </button>
            <button type="submit" className="btn-primary modal-done-btn">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsModal;
