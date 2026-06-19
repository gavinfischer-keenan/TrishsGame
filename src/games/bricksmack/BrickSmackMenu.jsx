import { useState } from 'react';

const BrickSmackMenu = ({ onStartGame, onBack }) => {
  const [gridSize, setGridSize] = useState(8);

  return (
    <div className="menu-container">
      <div className="menu-content">
        <button className="btn-back-home" onClick={onBack}>← Back to Games</button>
        <div className="title-group">
          <h1 className="game-title">Brick<span>Smack</span></h1>
        </div>
        <div className="settings-panel">
          <h3>Select Grid Size</h3>
          <div className="size-selector">
            {[8, 16].map(size => (
              <button 
                key={size}
                className={`btn-size ${gridSize === size ? 'active' : ''}`}
                onClick={() => setGridSize(size)}
              >
                {size}x{size}
              </button>
            ))}
          </div>
        </div>

        <div className="modes-panel">
          <button className="btn-mode normal" onClick={() => onStartGame('Normal', gridSize)}>
            Play Normal
          </button>
          <button className="btn-mode bonus" onClick={() => onStartGame('Color Coordinated', gridSize)}>
            Color Coordinated
          </button>
          <button className="btn-mode rotate" onClick={() => onStartGame('Colorfully rotate on this', gridSize)}>
            Colorfully rotate on this
          </button>
        </div>
      </div>
    </div>
  );
};

export default BrickSmackMenu;
