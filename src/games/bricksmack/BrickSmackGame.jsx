import { useState, useEffect, useRef } from 'react';
import { createEmptyGrid, canPlaceBlock, placeBlock, checkLineClears, checkGameOver } from './engine/GameLogic';
import { getRandomBlocks, rotateBlockClockwise } from './engine/BlockDefinitions';
import { useDragAndDrop } from './engine/useDragAndDrop';
import GameBoard from './GameBoard';
import BlockTray from './BlockTray';
import ConfettiBurst from '../../components/ConfettiBurst';
import ShareResultButton from '../../components/ShareResultButton';
import { playTone } from '../../utils/storage';

const Game = ({ gridSize, mode, settings, onExit, onRecordResult }) => {
  const [grid, setGrid] = useState(() => createEmptyGrid(gridSize));
  const [availableBlocks, setAvailableBlocks] = useState(() => getRandomBlocks(3));
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isNewBest, setIsNewBest] = useState(false);

  const boardRef = useRef(null);

  const highScoreKey = `bricksmack_highscore_${gridSize}_${mode.replace(/\s+/g, '_')}`;
  const [highScore, setHighScore] = useState(() => {
    try {
      return parseInt(localStorage.getItem(highScoreKey) || '0', 10);
    } catch {
      return 0;
    }
  });

  const finalizeGameOver = (finalScore) => {
    setGameOver(true);
    playTone('lose', settings?.soundEnabled);
    onRecordResult?.('bricksmack', { won: false, score: finalScore });
  };

  const handleBlockDrop = (block, sourceIndex, targetRow, targetCol) => {
    if (gameOver) return;

    if (canPlaceBlock(grid, block, targetRow, targetCol)) {
      let newGrid = placeBlock(grid, block, targetRow, targetCol);
      let pointsGained = block.width * block.height * 10;

      const { newGrid: clearedGrid, clearedLines, bonusColorMatches } = checkLineClears(newGrid);

      if (clearedLines > 0) {
        newGrid = clearedGrid;
        pointsGained += clearedLines * 100 * gridSize;
        if ((mode === 'Color Coordinated' || mode === 'Colorfully rotate on this') && bonusColorMatches > 0) {
          pointsGained += bonusColorMatches * 500 * gridSize;
        }
        playTone('hit', settings?.soundEnabled);
      } else {
        playTone('click', settings?.soundEnabled);
      }

      setGrid(newGrid);
      const newScore = score + pointsGained;
      setScore(newScore);

      if (newScore > highScore) {
        setHighScore(newScore);
        setIsNewBest(true);
        try {
          localStorage.setItem(highScoreKey, newScore.toString());
        } catch {
          // Ignore storage errors
        }
      }

      const newAvailableBlocks = [...availableBlocks];
      newAvailableBlocks[sourceIndex] = null;

      if (newAvailableBlocks.every((b) => b === null)) {
        const nextBlocks = getRandomBlocks(3);
        setAvailableBlocks(nextBlocks);
        setTimeout(() => {
          if (checkGameOver(newGrid, nextBlocks)) {
            finalizeGameOver(newScore);
          }
        }, 0);
      } else {
        setAvailableBlocks(newAvailableBlocks);
        const remaining = newAvailableBlocks.filter((b) => b !== null);
        if (checkGameOver(newGrid, remaining)) {
          finalizeGameOver(newScore);
        }
      }
    }
  };

  const rotateBlockInTray = (index) => {
    if (mode !== 'Colorfully rotate on this') return;
    playTone('click', settings?.soundEnabled);
    setAvailableBlocks((prev) => {
      const next = [...prev];
      if (next[index]) {
        next[index] = rotateBlockClockwise(next[index]);
      }
      return next;
    });
  };

  const {
    dragState,
    hoveredCell,
    startDrag,
    setBoardRect,
    cellWidth,
    cellHeight,
    dragOffsetX,
    dragOffsetY,
    visualShiftY,
  } = useDragAndDrop(gridSize, handleBlockDrop, mode === 'Colorfully rotate on this');

  useEffect(() => {
    const updateRect = () => {
      if (boardRef.current) {
        setBoardRect(boardRef.current.getBoundingClientRect());
      }
    };
    updateRect();
    window.addEventListener('resize', updateRect);
    return () => window.removeEventListener('resize', updateRect);
  }, [setBoardRect]);

  return (
    <div className="game-container">
      <ConfettiBurst active={gameOver && isNewBest} reducedMotion={settings?.reducedMotion} />

      <header className="game-header">
        <button type="button" className="btn-exit" onClick={onExit}>&larr; Exit</button>
        <div className="score-container">
          <div className="score-board">
            <div className="score-label">SCORE</div>
            <div className="score-value">{score}</div>
          </div>
          <div className="score-board best">
            <div className="score-label">BEST</div>
            <div className="score-value">{highScore}</div>
          </div>
        </div>
        <div className="mode-label">{mode}</div>
      </header>

      {gameOver && (
        <div className="game-over-overlay">
          <div className="overlay-card">
            <div className="overlay-icon">{isNewBest ? '🏆' : '🧱'}</div>
            <h2>{isNewBest ? 'New High Score!' : 'Game Over'}</h2>
            <p>Final Score: <strong>{score.toLocaleString()}</strong> ({gridSize}×{gridSize} · {mode})</p>
            <ShareResultButton
              title="🦐 Pistol Shrimp · BrickSmack"
              summary={`Scored ${score.toLocaleString()} points on ${gridSize}×${gridSize} (${mode})!`}
              urlHash="bricksmack"
            />
            <div className="overlay-actions">
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  setGrid(createEmptyGrid(gridSize));
                  setAvailableBlocks(getRandomBlocks(3));
                  setScore(0);
                  setGameOver(false);
                  setIsNewBest(false);
                }}
              >
                Try Again
              </button>
              <button type="button" className="btn-secondary" onClick={onExit}>
                Mode Menu
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="board-wrapper">
        <GameBoard
          boardRef={boardRef}
          grid={grid}
          gridSize={gridSize}
          hoveredCell={hoveredCell}
          draggedBlock={dragState.isDragging ? dragState.block : null}
          canPlace={
            dragState.isDragging && dragState.block && hoveredCell
              ? canPlaceBlock(grid, dragState.block, hoveredCell.row, hoveredCell.col)
              : false
          }
        />
      </div>

      <div className="tray-wrapper">
        <BlockTray
          blocks={availableBlocks}
          onDragStart={startDrag}
          draggedSourceIndex={dragState.isDragging ? dragState.sourceIndex : -1}
          onRotateBlock={rotateBlockInTray}
          mode={mode}
        />
      </div>

      {dragState.isDragging && dragState.block && (
        <div
          className="floating-block"
          style={{
            left: dragState.pointerX - dragOffsetX,
            top: dragState.pointerY - dragOffsetY - visualShiftY,
            opacity: 0.6,
          }}
        >
          <div
            className="block-preview"
            style={{
              gridTemplateColumns: `repeat(${dragState.block.width}, ${cellWidth}px)`,
              gridTemplateRows: `repeat(${dragState.block.height}, ${cellHeight}px)`,
            }}
          >
            {dragState.block.grid.flatMap((row, r) =>
              row.map((val, c) => (
                <div
                  key={`${r}-${c}`}
                  className={`cell ${val ? 'filled' : 'empty'}`}
                  style={{
                    backgroundColor: val ? dragState.block.color : 'transparent',
                    width: '100%',
                    height: '100%',
                  }}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Game;
