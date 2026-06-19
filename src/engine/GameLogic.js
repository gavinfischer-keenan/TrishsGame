export const createEmptyGrid = (size) => {
  const grid = [];
  for (let r = 0; r < size; r++) {
    const row = [];
    for (let c = 0; c < size; c++) {
      row.push(null); // null means empty, otherwise it holds the color string
    }
    grid.push(row);
  }
  return grid;
};

export const canPlaceBlock = (grid, block, startRow, startCol) => {
  const size = grid.length;
  for (let r = 0; r < block.height; r++) {
    for (let c = 0; c < block.width; c++) {
      if (block.grid[r][c] === 1) {
        const boardRow = startRow + r;
        const boardCol = startCol + c;
        // Check bounds
        if (boardRow < 0 || boardRow >= size || boardCol < 0 || boardCol >= size) {
          return false;
        }
        // Check overlap
        if (grid[boardRow][boardCol] !== null) {
          return false;
        }
      }
    }
  }
  return true;
};

export const placeBlock = (grid, block, startRow, startCol) => {
  // Return a new grid to maintain immutability
  const newGrid = grid.map(row => [...row]);
  
  for (let r = 0; r < block.height; r++) {
    for (let c = 0; c < block.width; c++) {
      if (block.grid[r][c] === 1) {
        newGrid[startRow + r][startCol + c] = block.color;
      }
    }
  }
  return newGrid;
};

export const checkLineClears = (grid) => {
  const size = grid.length;
  const rowsToClear = [];
  const colsToClear = [];
  let bonusColorMatches = 0;

  // Check rows
  for (let r = 0; r < size; r++) {
    let isFull = true;
    let firstColor = grid[r][0];
    let allSameColor = firstColor !== null;

    for (let c = 0; c < size; c++) {
      if (grid[r][c] === null) {
        isFull = false;
        break;
      }
      if (grid[r][c] !== firstColor) {
        allSameColor = false;
      }
    }
    if (isFull) {
      rowsToClear.push(r);
      if (allSameColor) bonusColorMatches++;
    }
  }

  // Check columns
  for (let c = 0; c < size; c++) {
    let isFull = true;
    let firstColor = grid[0][c];
    let allSameColor = firstColor !== null;

    for (let r = 0; r < size; r++) {
      if (grid[r][c] === null) {
        isFull = false;
        break;
      }
      if (grid[r][c] !== firstColor) {
        allSameColor = false;
      }
    }
    if (isFull) {
      colsToClear.push(c);
      if (allSameColor) bonusColorMatches++;
    }
  }

  // If nothing to clear, return null for performance
  if (rowsToClear.length === 0 && colsToClear.length === 0) {
    return { newGrid: grid, clearedLines: 0, bonusColorMatches: 0 };
  }

  // Create new grid with cleared lines
  const newGrid = grid.map(row => [...row]);
  
  rowsToClear.forEach(r => {
    for (let c = 0; c < size; c++) {
      newGrid[r][c] = null;
    }
  });

  colsToClear.forEach(c => {
    for (let r = 0; r < size; r++) {
      newGrid[r][c] = null;
    }
  });

  return { 
    newGrid, 
    clearedLines: rowsToClear.length + colsToClear.length, 
    bonusColorMatches 
  };
};

export const checkGameOver = (grid, availableBlocks) => {
  if (availableBlocks.length === 0) return false;
  
  const size = grid.length;
  // If ANY available block can be placed SOMEWHERE, it's not game over.
  for (const block of availableBlocks) {
    let canPlaceThisBlock = false;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (canPlaceBlock(grid, block, r, c)) {
          canPlaceThisBlock = true;
          break;
        }
      }
      if (canPlaceThisBlock) break;
    }
    // If we found a place for this block, we continue checking others (wait, if ONE block can be placed, is it not game over? The rule says "The game ends instantly when you run out of space to place any of your remaining blocks." So if NO blocks can be placed, it's game over. Wait. "run out of space to place ANY of your remaining blocks" - this usually means if there's at least one block in your tray that cannot be placed ANYWHERE, game over. Let's re-read: "The game ends instantly when you run out of space to place any of your remaining blocks."
    // In Block Blast, if you have 3 blocks, and 1 of them cannot be placed, the game ends immediately. You don't have to place the others first.
    // So if for ANY block in availableBlocks, it CANNOT be placed anywhere, GAME OVER.
    if (!canPlaceThisBlock) {
      return true; // Game Over!
    }
  }
  return false;
};
