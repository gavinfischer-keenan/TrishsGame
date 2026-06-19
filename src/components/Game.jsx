import { useState, useEffect, useRef } from 'react';
import { createEmptyGrid, canPlaceBlock, placeBlock, checkLineClears, checkGameOver } from '../engine/GameLogic';
import { getRandomBlocks, rotateBlockClockwise } from '../engine/BlockDefinitions';
import { useDragAndDrop } from '../engine/useDragAndDrop';
import GameBoard from './GameBoard';
import BlockTray from './BlockTray';

const Game = ({ gridSize, mode, onExit }) => {
  const [grid, setGrid] = useState(() => createEmptyGrid(gridSize));
  const [availableBlocks, setAvailableBlocks] = useState(() => getRandomBlocks(3));
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  
  const boardRef = useRef(null);

  const handleBlockDrop = (block, sourceIndex, targetRow, targetCol) => {
    if (gameOver) return;

    if (canPlaceBlock(grid, block, targetRow, targetCol)) {
      let newGrid = placeBlock(grid, block, targetRow, targetCol);
      let pointsGained = block.width * block.height * 10; // 10 points per cell
      
      const { newGrid: clearedGrid, clearedLines, bonusColorMatches } = checkLineClears(newGrid);
      
      if (clearedLines > 0) {
        newGrid = clearedGrid;
        // Basic line clear points
        pointsGained += clearedLines * 100 * gridSize; 
        
        if (mode === 'Bonus by Color' && bonusColorMatches > 0) {
           pointsGained += bonusColorMatches * 500 * gridSize;
        }
      }

      setGrid(newGrid);
      setScore(s => s + pointsGained);

      // Remove the used block
      const newAvailableBlocks = [...availableBlocks];
      newAvailableBlocks[sourceIndex] = null; // Mark as used

      // Check if we need a new set of blocks
      if (newAvailableBlocks.every(b => b === null)) {
        const nextBlocks = getRandomBlocks(3);
        setAvailableBlocks(nextBlocks);
        
        // Wait a tick to check game over with new blocks
        setTimeout(() => {
           if (checkGameOver(newGrid, nextBlocks)) {
             setGameOver(true);
           }
        }, 0);
      } else {
        setAvailableBlocks(newAvailableBlocks);
        
        // Check game over with remaining blocks
        const remaining = newAvailableBlocks.filter(b => b !== null);
        if (checkGameOver(newGrid, remaining)) {
          setGameOver(true);
        }
      }
    }
  };

  const rotateBlockInTray = (index) => {
    if (mode !== 'Rotate on this') return;
    setAvailableBlocks(prev => {
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
    visualShiftY
  } = useDragAndDrop(gridSize, handleBlockDrop, mode === 'Rotate on this');

  useEffect(() => {
    // Update board rect on mount and resize for accurate drag coordinates
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
      <header className="game-header">
        <button className="btn-exit" onClick={onExit}>&larr; Exit</button>
        <div className="score-board">
          <div className="score-label">SCORE</div>
          <div className="score-value">{score}</div>
        </div>
        <div className="mode-label">{mode} Mode</div>
      </header>

      {gameOver && (
        <div className="game-over-overlay">
          <h2>Game Over</h2>
          <p>Final Score: {score}</p>
          <button className="btn-primary" onClick={() => {
            setGrid(createEmptyGrid(gridSize));
            setAvailableBlocks(getRandomBlocks(3));
            setScore(0);
            setGameOver(false);
          }}>Try Again</button>
        </div>
      )}

      <div className="board-wrapper">
        <GameBoard 
          boardRef={boardRef}
          grid={grid} 
          gridSize={gridSize} 
          hoveredCell={hoveredCell} 
          draggedBlock={dragState.isDragging ? dragState.block : null} 
          canPlace={dragState.isDragging && dragState.block && hoveredCell ? canPlaceBlock(grid, dragState.block, hoveredCell.row, hoveredCell.col) : false}
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

      {/* Floating element for drag visual */}
      {dragState.isDragging && dragState.block && (
         <div className="floating-block" style={{
            left: dragState.pointerX - dragOffsetX,
            top: dragState.pointerY - dragOffsetY - visualShiftY,
            opacity: 0.6
         }}>
            <div className="block-preview" style={{ 
               gridTemplateColumns: `repeat(${dragState.block.width}, ${cellWidth}px)`,
               gridTemplateRows: `repeat(${dragState.block.height}, ${cellHeight}px)` 
            }}>
               {dragState.block.grid.flatMap((row, r) => 
                 row.map((val, c) => (
                   <div 
                     key={`${r}-${c}`} 
                     className={`cell ${val ? 'filled' : 'empty'}`} 
                     style={{ 
                       backgroundColor: val ? dragState.block.color : 'transparent',
                       width: '100%',
                       height: '100%'
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
