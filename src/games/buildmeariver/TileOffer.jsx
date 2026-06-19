import { TILE_MAP } from './engine/RiverTiles';

/**
 * TileOffer.jsx
 * Shows the 3 tile options offered to the player.
 * Clicking a tile selects it; clicking again deselects.
 *
 * Props:
 *   offer        - string[] of tile IDs (length 1-3)
 *   selectedTile - string|null  currently selected tile ID
 *   onSelect     - (tileId|null) => void
 */

const TileOffer = ({ offer, selectedTile, onSelect }) => {
  if (!offer || offer.length === 0) return null;

  const handleClick = (tileId) => {
    if (selectedTile === tileId) {
      onSelect(null); // deselect
    } else {
      onSelect(tileId);
    }
  };

  return (
    <div className="river-tile-offer">
      <p className="offer-label">Select a tile to place</p>
      <div className="offer-tiles">
        {offer.map((tileId, i) => {
          const tile = TILE_MAP[tileId];
          if (!tile) return null;
          const isSelected = selectedTile === tileId;

          return (
            <button
              key={`${tileId}-${i}`}
              className={`offer-tile-btn ${isSelected ? 'selected' : ''}`}
              onClick={() => handleClick(tileId)}
              title={tile.label}
            >
              <svg viewBox="0 0 100 100" className="offer-tile-svg">
                {/* Background */}
                <rect x={0} y={0} width={100} height={100}
                  fill={isSelected ? 'rgba(59,130,246,0.25)' : 'rgba(15,23,42,0.8)'}
                  rx={6}
                />
                {/* River fill path */}
                {tile.fillPath && (
                  <path
                    d={tile.fillPath}
                    fill={isSelected ? '#60a5fa' : '#3b82f6'}
                    opacity={0.9}
                  />
                )}
                {/* Border highlight */}
                {tile.fillPath && (
                  <path d={tile.fillPath} fill="none"
                    stroke={isSelected ? '#93c5fd' : '#1d4ed8'}
                    strokeWidth={2.5}
                    opacity={0.7}
                  />
                )}
              </svg>
              <span className="offer-tile-label">{tile.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TileOffer;
