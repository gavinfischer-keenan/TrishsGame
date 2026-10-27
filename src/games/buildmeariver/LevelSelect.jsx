import { useState } from 'react';
import { LEVELS } from './engine/RiverLevels';
import { SIZE_LABELS } from './engine/RiverLevels';

/**
 * LevelSelect.jsx
 * The level selection screen for Build Me a River.
 *
 * Props:
 *   onSelectLevel - (level, sizeName) => void
 *   onBack        - () => void  — returns to home screen
 */

const LevelSelect = ({ onSelectLevel, onBack }) => {
  const [sizeName, setSizeName] = useState('stream');

  return (
    <div className="river-level-select">
      <header className="river-ls-header">
        <button className="btn-back-home" onClick={onBack}>← Back to Games</button>
        <div className="river-title-group">
          <img className="namesake-menu-logo" src="/brand/mudskipper-logo-v2.jpg" alt="Mudskipper logo" />
          <h2 className="namesake-animal">Mudskipper</h2>
          <h1 className="river-title">Build Me a River</h1>
          <a className="namesake-about" href="/about/mudskipper/">About the Fish →</a>
          <p className="river-subtitle">Route the flow. Beat the land.</p>
        </div>
      </header>

      <section className="river-size-section">
        <h3 className="section-label">Grid Size</h3>
        <div className="river-size-selector">
          {SIZE_LABELS.map(({ key, label, subtitle }) => (
            <button
              key={key}
              className={`btn-river-size ${sizeName === key ? 'active' : ''}`}
              onClick={() => setSizeName(key)}
            >
              <span className="size-name">{label}</span>
              <span className="size-sub">{subtitle}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="river-levels-section">
        <h3 className="section-label">Choose a Level</h3>
        <div className="river-level-grid">
          {LEVELS.map(level => (
            <button
              key={level.id}
              className={`river-level-card ${level.comingSoon ? 'coming-soon' : ''}`}
              onClick={() => !level.comingSoon && onSelectLevel(level, sizeName)}
              disabled={!!level.comingSoon}
            >
              <div className="level-number">Level {level.id}</div>
              <div className="level-name">{level.label}</div>
              <div className="level-desc">{level.description}</div>
              {level.comingSoon && (
                <div className="coming-soon-badge">🔒 Coming Soon</div>
              )}
            </button>
          ))}

          {/* Level Editor placeholder */}
          <button className="river-level-card coming-soon level-editor-card" disabled>
            <div className="level-number">✏️</div>
            <div className="level-name">Level Editor</div>
            <div className="level-desc">Design your own river puzzle.</div>
            <div className="coming-soon-badge">🔒 Coming Soon</div>
          </button>
        </div>
      </section>
    </div>
  );
};

export default LevelSelect;
