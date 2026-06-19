
const GameBoard = ({ boardRef, grid, gridSize, hoveredCell, draggedBlock, canPlace }) => {
  // Determine which rows and columns will be cleared if placed
  const rowsToFlash = new Set();
  const colsToFlash = new Set();

  if (draggedBlock && hoveredCell && canPlace) {
    // Check rows
    for (let r = 0; r < gridSize; r++) {
      let isRowCompleted = true;
      for (let c = 0; c < gridSize; c++) {
        const isFilled = grid[r][c] !== null;
        const blockR = r - hoveredCell.row;
        const blockC = c - hoveredCell.col;
        const isCovered = blockR >= 0 && blockR < draggedBlock.height &&
                          blockC >= 0 && blockC < draggedBlock.width &&
                          draggedBlock.grid[blockR][blockC] === 1;

        if (!isFilled && !isCovered) {
          isRowCompleted = false;
          break;
        }
      }
      if (isRowCompleted) {
        rowsToFlash.add(r);
      }
    }

    // Check columns
    for (let c = 0; c < gridSize; c++) {
      let isColCompleted = true;
      for (let r = 0; r < gridSize; r++) {
        const isFilled = grid[r][c] !== null;
        const blockR = r - hoveredCell.row;
        const blockC = c - hoveredCell.col;
        const isCovered = blockR >= 0 && blockR < draggedBlock.height &&
                          blockC >= 0 && blockC < draggedBlock.width &&
                          draggedBlock.grid[blockR][blockC] === 1;

        if (!isFilled && !isCovered) {
          isColCompleted = false;
          break;
        }
      }
      if (isColCompleted) {
        colsToFlash.add(c);
      }
    }
  }

  return (
    <div 
      ref={boardRef}
      className="game-board" 
      style={{ 
        gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
        gridTemplateRows: `repeat(${gridSize}, 1fr)`
      }}
    >
      {grid.map((row, rIndex) => (
        row.map((cellColor, cIndex) => {
          
          let isShadow = false;
          let shadowColor = null;

          // Determine if this cell is part of the shadow of the dragged block
          if (draggedBlock && hoveredCell) {
            const rowOffset = rIndex - hoveredCell.row;
            const colOffset = cIndex - hoveredCell.col;
            
            if (rowOffset >= 0 && rowOffset < draggedBlock.height && 
                colOffset >= 0 && colOffset < draggedBlock.width) {
              if (draggedBlock.grid[rowOffset][colOffset] === 1) {
                isShadow = true;
                shadowColor = draggedBlock.color;
              }
            }
          }

          let className = 'board-cell';
          if (cellColor) className += ' filled';
          else if (isShadow) {
            className += canPlace ? ' shadow-valid' : ' shadow-invalid';
          }

          if (rowsToFlash.has(rIndex) || colsToFlash.has(cIndex)) {
            className += ' will-clear';
          }

          return (
            <div 
              key={`${rIndex}-${cIndex}`} 
              className={className}
              style={{ 
                backgroundColor: cellColor || (isShadow && canPlace ? shadowColor : undefined)
              }}
            >
              {/* Optional inner detail for premium look */}
              <div className="cell-inner" />
            </div>
          );
        })
      ))}
    </div>
  );
};

export default GameBoard;
