import { LEVELS, parseLevelGrid } from './levels';

const NumberDrawingMenu = ({ onPlayLevel, onOpenEditor, onBack }) => {
  return (
    <div className="nd-menu">
      <div className="nd-menu-content">
        <button className="btn-back-home" onClick={onBack}>← Back to Games</button>

        <h1 className="nd-menu-title">Number Drawing</h1>
        <p className="nd-menu-tagline">Reconstruct ASCII masterpieces with sums and logic</p>

        <div className="nd-level-grid">
          {LEVELS.map((level, i) => (
            <button 
              key={level.id} 
              className="nd-level-btn"
              onClick={() => onPlayLevel(parseLevelGrid(level.grid))}
            >
              <div className="nd-level-num">{i + 1}</div>
              <div className="nd-level-name">{level.name}</div>
            </button>
          ))}
        </div>

        <div className="nd-menu-actions">
          <button className="btn-secondary" onClick={onOpenEditor}>
            Level Editor
          </button>
        </div>
      </div>
    </div>
  );
};

export default NumberDrawingMenu;
