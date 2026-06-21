import { useState, useMemo, useCallback } from 'react';

// Distinct faint pastel colors for the blobs
const BLOB_COLORS = [
  'rgba(239, 68, 68, 0.15)',   // Red
  'rgba(59, 130, 246, 0.15)',  // Blue
  'rgba(16, 185, 129, 0.15)',  // Green
  'rgba(245, 158, 11, 0.15)',  // Yellow
  'rgba(139, 92, 246, 0.15)',  // Purple
  'rgba(236, 72, 153, 0.15)',  // Pink
  'rgba(20, 184, 166, 0.15)',  // Teal
  'rgba(249, 115, 22, 0.15)',  // Orange
  'rgba(99, 102, 241, 0.15)',  // Indigo
];

function generateBlobs(gridData) {
  const height = gridData.length;
  const width = gridData[0].length;
  const visited = Array(height).fill(0).map(() => Array(width).fill(false));
  const blobs = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (gridData[y][x].type === 'playable' && !visited[y][x]) {
        const target = gridData[y][x].target;
        const blobCells = [];
        const q = [[x, y]];
        visited[y][x] = true;

        while (q.length > 0) {
          const [cx, cy] = q.shift();
          blobCells.push({x: cx, y: cy});
          
          const neighbors = [[0,1],[1,0],[0,-1],[-1,0]];
          for (let [dx, dy] of neighbors) {
            const nx = cx + dx, ny = cy + dy;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              if (!visited[ny][nx] && gridData[ny][nx].type === 'playable' && gridData[ny][nx].target === target) {
                visited[ny][nx] = true;
                q.push([nx, ny]);
              }
            }
          }
        }
        blobs.push(blobCells);
      }
    }
  }

  // Greedy coloring so adjacent blobs don't have the same color
  const blobColors = new Array(blobs.length).fill(-1);
  const getNeighbors = (blobIdx) => {
    const neighbors = new Set();
    const cells = blobs[blobIdx];
    for (let cell of cells) {
      for (let [dx, dy] of [[0,1],[1,0],[0,-1],[-1,0]]) {
        const nx = cell.x + dx, ny = cell.y + dy;
        if (nx >= 0 && nx < width && ny >= 0 && ny < height && gridData[ny][nx].blobIdx !== undefined) {
          if (gridData[ny][nx].blobIdx !== blobIdx) {
            neighbors.add(gridData[ny][nx].blobIdx);
          }
        }
      }
    }
    return Array.from(neighbors);
  };

  // Assign blobIdx to grid for neighbor lookup
  blobs.forEach((cells, i) => cells.forEach(c => gridData[c.y][c.x].blobIdx = i));

  for (let i = 0; i < blobs.length; i++) {
    const neighborColors = new Set(getNeighbors(i).map(n => blobColors[n]).filter(c => c !== -1));
    let colorIdx = 0;
    while (neighborColors.has(colorIdx)) {
      colorIdx++;
    }
    blobColors[i] = colorIdx % BLOB_COLORS.length;
    blobs[i].forEach(c => gridData[c.y][c.x].color = BLOB_COLORS[blobColors[i]]);
  }
}

function calculateSegments(gridData, isRow) {
  const hints = [];
  const primaryLen = isRow ? gridData.length : gridData[0].length;
  const secondaryLen = isRow ? gridData[0].length : gridData.length;

  for (let i = 0; i < primaryLen; i++) {
    const lineHints = [];
    let currentSum = 0;
    let inSegment = false;
    let segCells = [];

    for (let j = 0; j <= secondaryLen; j++) {
      const cell = j < secondaryLen ? (isRow ? gridData[i][j] : gridData[j][i]) : null;
      const isPlayable = cell && cell.type === 'playable';

      if (isPlayable) {
        inSegment = true;
        currentSum += cell.target;
        segCells.push(j);
      } else {
        if (inSegment) {
          lineHints.push({ sum: currentSum, cells: segCells });
          currentSum = 0;
          inSegment = false;
          segCells = [];
        }
      }
    }
    hints.push(lineHints);
  }
  return hints;
}

const NumberDrawingGame = ({ levelData, onExit }) => {
  // Parse level data once
  const { grid, width, height, rowHints, colHints, availableNumbers } = useMemo(() => {
    const g = JSON.parse(JSON.stringify(levelData));
    generateBlobs(g);
    
    const rHints = calculateSegments(g, true);
    const cHints = calculateSegments(g, false);
    
    const nums = new Set();
    g.forEach(r => r.forEach(c => {
      if (c.type === 'playable') nums.add(c.target);
    }));

    return {
      grid: g,
      width: g[0].length,
      height: g.length,
      rowHints: rHints,
      colHints: cHints,
      availableNumbers: Array.from(nums).sort((a,b)=>a-b)
    };
  }, [levelData]);

  // Init state based on grid
  const [playerGrid, setPlayerGrid] = useState(() => grid.map(r => r.map(c => c.type === 'playable' ? null : 'empty')));
  const [selectedNumber, setSelectedNumber] = useState(null);
  const [isMouseDown, setIsMouseDown] = useState(false);

  // Derived state for Win/Correct
  const { won, correctButWrong } = useMemo(() => {
    if (playerGrid.length === 0) return { won: false, correctButWrong: false };
    
    let perfectMatch = true;
    let allFilled = true;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (grid[y][x].type === 'playable') {
          if (playerGrid[y][x] === null) allFilled = false;
          if (playerGrid[y][x] !== grid[y][x].target) perfectMatch = false;
        }
      }
    }

    if (!allFilled) return { won: false, correctButWrong: false };
    if (perfectMatch) return { won: true, correctButWrong: false };

    let sumsMatch = true;
    for (let y = 0; y < height; y++) {
      rowHints[y].forEach(seg => {
        let sum = 0;
        seg.cells.forEach(x => sum += (playerGrid[y][x] || 0));
        if (sum !== seg.sum) sumsMatch = false;
      });
    }
    for (let x = 0; x < width; x++) {
      colHints[x].forEach(seg => {
        let sum = 0;
        seg.cells.forEach(y => sum += (playerGrid[y][x] || 0));
        if (sum !== seg.sum) sumsMatch = false;
      });
    }

    return { won: false, correctButWrong: sumsMatch };
  }, [playerGrid, grid, height, width, rowHints, colHints]);

  const placeNumber = useCallback((x, y) => {
    if (won || selectedNumber === null || grid[y][x].type !== 'playable') return;
    
    setPlayerGrid(prev => {
      const next = [...prev];
      next[y] = [...next[y]];
      
      // Toggle logic: if clicking the same number, clear it
      if (next[y][x] === selectedNumber && !isMouseDown) {
        next[y][x] = null;
      } else {
        next[y][x] = selectedNumber;
      }
      return next;
    });
  }, [won, selectedNumber, grid, isMouseDown]);


  // Calculate current sums for visual feedback
  const getRowSegSum = (y, segCells) => segCells.reduce((acc, x) => acc + (playerGrid[y]?.[x] || 0), 0);
  const getColSegSum = (x, segCells) => segCells.reduce((acc, y) => acc + (playerGrid[y]?.[x] || 0), 0);

  if (playerGrid.length === 0) return null;

  return (
    <div 
      className="nd-game" 
      onMouseUp={() => setIsMouseDown(false)}
      onMouseLeave={() => setIsMouseDown(false)}
    >
      <header className="nd-header">
        <button className="btn-exit" onClick={onExit}>← Exit</button>
        <h2 className="nd-title">Number Drawing</h2>
        <button className="btn-secondary" onClick={() => setPlayerGrid(grid.map(r => r.map(c => c.type === 'playable' ? null : 'empty')))}>Clear</button>
      </header>

      {correctButWrong && !won && (
        <div className="nd-warning-banner">
          🧠 Wow! You found a mathematically correct solution, but it doesn't match the original ASCII art. Keep trying to find the *true* picture!
        </div>
      )}

      <div className="nd-board-container">
        <div className="nd-grid-layout" style={{ '--cols': width, '--rows': height }}>
          
          {/* Top-left empty corner */}
          <div className="nd-corner"></div>

          {/* Column Hints (Top) */}
          <div className="nd-col-hints">
            {colHints.map((hints, x) => (
              <div key={x} className="nd-hint-col">
                {hints.map((h, i) => {
                  const currentSum = getColSegSum(x, h.cells);
                  const isFull = h.cells.every(y => playerGrid[y][x] !== null);
                  const isCorrect = isFull && currentSum === h.sum;
                  const isOver = currentSum > h.sum;
                  return (
                    <div key={i} className={`nd-hint-text ${isCorrect ? 'nd-hint-correct' : isOver ? 'nd-hint-error' : ''}`}>
                      {h.sum}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Row Hints (Left) */}
          <div className="nd-row-hints">
            {rowHints.map((hints, y) => (
              <div key={y} className="nd-hint-row">
                {hints.map((h, i) => {
                  const currentSum = getRowSegSum(y, h.cells);
                  const isFull = h.cells.every(x => playerGrid[y][x] !== null);
                  const isCorrect = isFull && currentSum === h.sum;
                  const isOver = currentSum > h.sum;
                  return (
                    <div key={i} className={`nd-hint-text ${isCorrect ? 'nd-hint-correct' : isOver ? 'nd-hint-error' : ''}`}>
                      {h.sum}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* The Playable Grid */}
          <div className="nd-play-area">
            {grid.map((row, y) => (
              row.map((cell, x) => {
                if (cell.type === 'empty') {
                  return <div key={`${x}-${y}`} className="nd-cell nd-cell-empty" />;
                }

                // Determine border connections for the blob
                const sameUp = y > 0 && grid[y-1][x].blobIdx === cell.blobIdx;
                const sameDown = y < height - 1 && grid[y+1][x].blobIdx === cell.blobIdx;
                const sameLeft = x > 0 && grid[y][x-1].blobIdx === cell.blobIdx;
                const sameRight = x < width - 1 && grid[y][x+1].blobIdx === cell.blobIdx;

                return (
                  <div 
                    key={`${x}-${y}`} 
                    className="nd-cell nd-cell-playable"
                    style={{ 
                      backgroundColor: cell.color,
                      borderTopStyle: sameUp ? 'dashed' : 'solid',
                      borderBottomStyle: sameDown ? 'dashed' : 'solid',
                      borderLeftStyle: sameLeft ? 'dashed' : 'solid',
                      borderRightStyle: sameRight ? 'dashed' : 'solid',
                      borderColor: 'rgba(255,255,255,0.2)',
                    }}
                    onMouseDown={() => { setIsMouseDown(true); placeNumber(x, y); }}
                    onMouseEnter={() => { if (isMouseDown) placeNumber(x, y); }}
                  >
                    {playerGrid[y][x] !== null ? playerGrid[y][x] : ''}
                  </div>
                );
              })
            ))}
          </div>
        </div>
      </div>

      <div className="nd-palette">
        <button 
          className={`nd-pal-btn ${selectedNumber === null ? 'nd-pal-btn-active' : ''}`}
          onClick={() => setSelectedNumber(null)}
        >
          ✖
        </button>
        {availableNumbers.map(n => (
          <button 
            key={n}
            className={`nd-pal-btn ${selectedNumber === n ? 'nd-pal-btn-active' : ''}`}
            onClick={() => setSelectedNumber(n)}
          >
            {n}
          </button>
        ))}
      </div>

      {won && (
        <div className="smm-overlay">
          <div className="overlay-card smm-overlay-card">
            <div className="overlay-icon">🎨</div>
            <h2>Masterpiece Complete!</h2>
            <p>You successfully reconstructed the ASCII art!</p>
            <div className="overlay-actions">
              <button className="btn-primary" onClick={onExit}>Back to Levels</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default NumberDrawingGame;
