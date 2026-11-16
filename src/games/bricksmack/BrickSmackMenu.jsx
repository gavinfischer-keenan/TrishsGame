import { useState } from 'react';

const BrickSmackMenu = ({ defaultGridSize = 8, onStartGame, onBack }) => {
  const [gridSize, setGridSize] = useState(defaultGridSize);

  return (
    <div className="menu-container">
      <div className="menu-content">
        <div className="game-menu-top">
          <button type="button" className="btn-back-home" onClick={onBack}>← Back to Games</button>
        </div>
        <div className="title-group">
          <img className="namesake-menu-logo" src="/brand/pistol-shrimp-logo-v2.jpg" alt="Pistol Shrimp logo" />
          <h2 className="namesake-animal">Pistol Shrimp</h2>
          <h1 className="game-title">Brick<span>Smack</span></h1>
          <a className="namesake-about" href="/about/pistol-shrimp/">About the Shrimp →</a>
        </div>
        <div className="settings-panel">
          <h3>Select Grid Size</h3>
          <div className="size-selector">
            {[8, 16].map((size) => (
              <button
                key={size}
                type="button"
                className={`btn-size ${gridSize === size ? 'active' : ''}`}
                onClick={() => setGridSize(size)}
              >
                {size}×{size}
              </button>
            ))}
          </div>
        </div>

        <div className="modes-panel">
          <button type="button" className="btn-mode normal" onClick={() => onStartGame('Normal', gridSize)}>
            <span>Play Normal</span>
            <small className="btn-mode-sub">Classic block stacking &amp; line clears</small>
          </button>
          <button type="button" className="btn-mode bonus" onClick={() => onStartGame('Color Coordinated', gridSize)}>
            <span>Color Coordinated</span>
            <small className="btn-mode-sub">Bonus multipliers for matching single-color lines</small>
          </button>
          <button type="button" className="btn-mode rotate" onClick={() => onStartGame('Colorfully rotate on this', gridSize)}>
            <span>Colorfully rotate on this</span>
            <small className="btn-mode-sub">Rotate pieces (↻ or Space) + color bonuses</small>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BrickSmackMenu;
