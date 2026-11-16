import { useState, useCallback } from 'react';
import RiverBoard from './RiverBoard';
import TileOffer from './TileOffer';
import ConfettiBurst from '../../components/ConfettiBurst';
import ShareResultButton from '../../components/ShareResultButton';
import { playTone } from '../../utils/storage';
import {
  buildInitialGrid,
  computeOpenEnds,
  processTilePlacement,
  getValidCells,
  generateOffer,
  checkWin,
  checkLoss,
} from './engine/RiverLogic';
import { SIZE_MAP } from './engine/RiverLevels';

const RiverGame = ({ level, sizeName, settings, onExit, onRecordResult }) => {
  const gridSize = SIZE_MAP[sizeName] || 16;

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
      lastRedirected: false,
    };
  };

  const [state, setState] = useState(initState);

  const handleSelectTile = useCallback(
    (tileId) => {
      playTone('click', settings?.soundEnabled);
      setState((prev) => {
        if (!tileId) return { ...prev, selectedTile: null, validCells: new Set() };
        const validCells = getValidCells(tileId, prev.openEnds, prev.grid, gridSize);
        return { ...prev, selectedTile: tileId, validCells };
      });
    },
    [gridSize, settings?.soundEnabled]
  );

  const handleCellClick = useCallback(
    (row, col) => {
      setState((prev) => {
        if (!prev.selectedTile) return prev;
        if (!prev.validCells.has(`${row},${col}`)) return prev;

        const { grid: newGrid, actualTileId } = processTilePlacement(
          prev.grid,
          prev.selectedTile,
          row,
          col,
          prev.openEnds,
          gridSize
        );
        const wasRedirected = actualTileId !== prev.selectedTile;
        const newTilesPlaced = prev.tilesPlaced + 1;

        const won = checkWin(newGrid, level, gridSize, prev.startOpenEnd);
        if (won) {
          playTone('win', settings?.soundEnabled);
          onRecordResult?.('buildmeariver', { won: true });
          return {
            ...prev,
            grid: newGrid,
            isWon: true,
            selectedTile: null,
            validCells: new Set(),
            tilesPlaced: newTilesPlaced,
            lastRedirected: wasRedirected,
          };
        }

        const newOpenEnds = computeOpenEnds(newGrid, [prev.startOpenEnd], gridSize);

        const lost = checkLoss(newOpenEnds, newGrid, gridSize);
        if (lost) {
          playTone('lose', settings?.soundEnabled);
          onRecordResult?.('buildmeariver', { won: false });
          return {
            ...prev,
            grid: newGrid,
            openEnds: newOpenEnds,
            isLost: true,
            selectedTile: null,
            validCells: new Set(),
            tilesPlaced: newTilesPlaced,
            lastRedirected: wasRedirected,
          };
        }

        const { offer, isGameOver } = generateOffer(newOpenEnds, newGrid, gridSize);
        if (isGameOver) {
          playTone('lose', settings?.soundEnabled);
          onRecordResult?.('buildmeariver', { won: false });
          return {
            ...prev,
            grid: newGrid,
            openEnds: newOpenEnds,
            offer: [],
            isLost: true,
            selectedTile: null,
            validCells: new Set(),
            tilesPlaced: newTilesPlaced,
            lastRedirected: wasRedirected,
          };
        }

        playTone('hit', settings?.soundEnabled);
        return {
          ...prev,
          grid: newGrid,
          openEnds: newOpenEnds,
          offer,
          selectedTile: null,
          validCells: new Set(),
          tilesPlaced: newTilesPlaced,
          lastRedirected: wasRedirected,
        };
      });
    },
    [level, gridSize, settings?.soundEnabled, onRecordResult]
  );

  const handleRestart = () => setState(initState());

  const { grid, offer, selectedTile, validCells, isWon, isLost, tilesPlaced, lastRedirected } = state;

  return (
    <div className="river-game-container">
      <ConfettiBurst active={isWon} reducedMotion={settings?.reducedMotion} />

      <header className="river-game-header">
        <button type="button" className="btn-exit" onClick={onExit}>← Exit</button>
        <div className="river-game-title">
          <span className="river-level-badge">{level.badge || `Level ${level.id}`}</span>
          <span className="river-level-name">{level.label}</span>
        </div>
        <div className="river-tiles-count">
          Tiles: <strong>{tilesPlaced}</strong>
          {lastRedirected && <span className="redirect-notice"> ↩ redirected</span>}
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

      {isWon && (
        <div className="river-overlay win-overlay">
          <div className="overlay-card">
            <div className="overlay-icon">🎉</div>
            <h2>River Complete!</h2>
            <p>You connected the flow on <strong>{level.label}</strong> ({sizeName}) in <strong>{tilesPlaced}</strong> tiles.</p>
            <ShareResultButton
              title="🐟 Mudskipper · Build Me a River"
              summary={`Completed "${level.label}" (${gridSize}×${gridSize}) using ${tilesPlaced} river tiles!`}
              urlHash="buildmeariver"
            />
            <div className="overlay-actions">
              <button type="button" className="btn-primary" onClick={handleRestart}>Play Again</button>
              <button type="button" className="btn-secondary" onClick={onExit}>Level Select</button>
            </div>
          </div>
        </div>
      )}

      {isLost && !isWon && (
        <div className="river-overlay loss-overlay">
          <div className="overlay-card">
            <div className="overlay-icon">🌊</div>
            <h2>River Blocked!</h2>
            <p>No more tiles can be placed after {tilesPlaced} moves. Try another route!</p>
            <div className="overlay-actions">
              <button type="button" className="btn-primary" onClick={handleRestart}>Try Again</button>
              <button type="button" className="btn-secondary" onClick={onExit}>Level Select</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RiverGame;
