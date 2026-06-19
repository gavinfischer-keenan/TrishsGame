import { useState, useCallback } from 'react';
import RiverBoard from './RiverBoard';
import TileOffer from './TileOffer';
import {
  buildInitialGrid,
  computeOpenEnds,
  placeTile,
  getValidCells,
  generateOffer,
  checkWin,
  checkLoss,
} from './engine/RiverLogic';
import { SIZE_MAP } from './engine/RiverLevels';

/**
 * RiverGame.jsx
 * Orchestrates a single round of Build Me a River.
 *
 * Props:
 *   level     - level definition object
 *   sizeName  - 'stream' | 'river' | 'flood'
 *   onExit    - () => void  (return to level select)
 */

const RiverGame = ({ level, sizeName, onExit }) => {
  const gridSize = SIZE_MAP[sizeName] || 16;

  // Build initial grid and start open end
  const initState = () => {
    const { grid, startOpenEnd } = buildInitialGrid(level, gridSize);
    const openEnds = [startOpenEnd];
    const { offer, isGameOver } = generateOffer(openEnds, grid, gridSize);
    return {
      grid,
      openEnds,
      startOpenEnd,
      offer: offer || [],
      selectedTile: null,
      validCells: new Set(),
      isWon: false,
      isLost: isGameOver,
      tilesPlaced: 0,
    };
  };

  const [state, setState] = useState(initState);

  const handleSelectTile = useCallback((tileId) => {
    setState(prev => {
      if (!tileId) return { ...prev, selectedTile: null, validCells: new Set() };
      const validCells = getValidCells(tileId, prev.openEnds, prev.grid, gridSize);
      return { ...prev, selectedTile: tileId, validCells };
    });
  }, [gridSize]);

  const handleCellClick = useCallback((row, col) => {
    setState(prev => {
      if (!prev.selectedTile) return prev;
      const cellKey = `${row},${col}`;
      if (!prev.validCells.has(cellKey)) return prev;

      // Place the tile
      const newGrid = placeTile(prev.grid, prev.selectedTile, row, col);
      const newTilesPlaced = prev.tilesPlaced + 1;

      // Check win
      const won = checkWin(newGrid, level, gridSize, prev.startOpenEnd);
      if (won) {
        return { ...prev, grid: newGrid, isWon: true, selectedTile: null, validCells: new Set(), tilesPlaced: newTilesPlaced };
      }

      // Recompute open ends
      const newOpenEnds = computeOpenEnds(newGrid, [prev.startOpenEnd], gridSize);

      // Check loss
      const lost = checkLoss(newOpenEnds, newGrid, gridSize);
      if (lost) {
        return { ...prev, grid: newGrid, openEnds: newOpenEnds, isLost: true, selectedTile: null, validCells: new Set(), tilesPlaced: newTilesPlaced };
      }

      // Generate new offer
      const { offer, isGameOver } = generateOffer(newOpenEnds, newGrid, gridSize);
      if (isGameOver) {
        return { ...prev, grid: newGrid, openEnds: newOpenEnds, offer: [], isLost: true, selectedTile: null, validCells: new Set(), tilesPlaced: newTilesPlaced };
      }

      return {
        ...prev,
        grid: newGrid,
        openEnds: newOpenEnds,
        offer,
        selectedTile: null,
        validCells: new Set(),
        tilesPlaced: newTilesPlaced,
      };
    });
  }, [level, gridSize]);

  const handleRestart = () => setState(initState());

  const { grid, offer, selectedTile, validCells, isWon, isLost, tilesPlaced, startOpenEnd } = state;

  return (
    <div className="river-game-container">
      <header className="river-game-header">
        <button className="btn-exit" onClick={onExit}>← Exit</button>
        <div className="river-game-title">
          <span className="river-level-badge">Level {level.id}</span>
          <span className="river-level-name">{level.label}</span>
        </div>
        <div className="river-tiles-count">
          Tiles placed: <strong>{tilesPlaced}</strong>
        </div>
      </header>

      <div className="river-board-area">
        <RiverBoard
          grid={grid}
          gridSize={gridSize}
          level={level}
          validCells={validCells}
          selectedTile={selectedTile}
          onCellClick={handleCellClick}
          startOpenEnd={startOpenEnd}
        />
      </div>

      <div className="river-offer-area">
        {!isWon && !isLost && (
          <TileOffer
            offer={offer}
            selectedTile={selectedTile}
            onSelect={handleSelectTile}
          />
        )}
      </div>

      {/* Win overlay */}
      {isWon && (
        <div className="river-overlay win-overlay">
          <div className="overlay-card">
            <div className="overlay-icon">🎉</div>
            <h2>River Complete!</h2>
            <p>You connected the flow in <strong>{tilesPlaced}</strong> tiles.</p>
            <div className="overlay-actions">
              <button className="btn-primary" onClick={handleRestart}>Play Again</button>
              <button className="btn-secondary" onClick={onExit}>Level Select</button>
            </div>
          </div>
        </div>
      )}

      {/* Loss overlay */}
      {isLost && !isWon && (
        <div className="river-overlay loss-overlay">
          <div className="overlay-card">
            <div className="overlay-icon">🌊</div>
            <h2>River Blocked!</h2>
            <p>No more tiles can be placed. The river has nowhere to go.</p>
            <div className="overlay-actions">
              <button className="btn-primary" onClick={handleRestart}>Try Again</button>
              <button className="btn-secondary" onClick={onExit}>Level Select</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RiverGame;
