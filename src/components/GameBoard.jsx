
const GameBoard = ({ boardRef, grid, gridSize, hoveredCell, draggedBlock, canPlace }) => {
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
