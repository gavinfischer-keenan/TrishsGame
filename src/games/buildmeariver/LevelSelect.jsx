import { useState } from 'react';
import { LEVELS, SIZE_LABELS } from './engine/RiverLevels';

/**
 * LevelSelect.jsx
 * Level and grid-scale selection screen for Build Me a River.
 */
const LevelSelect = ({ initialSize = 'stream', onSelectLevel, onBack }) => {
  const [sizeName, setSizeName] = useState(initialSize);

  return (
    <div className="river-level-select">
      <header className="river-ls-header">
        <button type="button" className="btn-back-home" onClick={onBack}>← Back to Games</button>
        <div className="river-title-group">
          <img className="namesake-menu-logo" src="/brand/mudskipper-logo-v2.jpg" alt="Mudskipper logo" />
          <h2 className="namesake-animal">Mudskipper</h2>
          <h1 className="river-title">Build Me a River</h1>
          <a className="namesake-about" href="/about/mudskipper/">About the Fish →</a>
          <p className="river-subtitle">Route the flow from spring to sea around rocks, houses, trees, and lakes.</p>
        </div>
      </header>

      <section className="river-size-section">
        <h3 className="section-label">Grid Size</h3>
        <div className="river-size-selector">
          {SIZE_LABELS.map(({ key, label, subtitle }) => (
            <button
              key={key}
              type="button"
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
          {LEVELS.map((level) => (
            <button
              key={level.id}
              type="button"
              className="river-level-card"
              onClick={() => onSelectLevel(level, sizeName)}
            >
              <div className="level-number">{level.badge || `Level ${level.id}`}</div>
              <div className="level-name">{level.label}</div>
              <div className="level-desc">{level.description}</div>
              <div className="level-play-cue">Play Level →</div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};

export default LevelSelect;
