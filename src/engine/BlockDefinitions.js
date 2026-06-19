export const BLOCK_COLORS = [
  '#ff4757', // Red
  '#2ed573', // Green
  '#1e90ff', // Blue
  '#ffa502', // Yellow
  '#9c88ff', // Purple
  '#ff7f50', // Orange
  '#ff6b81', // Pink
  '#8e44ad', // Deep Purple
  '#f1f2f6'  // Light (White-ish)
];

// 1 means solid block cell, 0 means empty space
export const SHAPE_DEFINITIONS = [
  // 1x1
  { id: '1x1', grid: [[1]], weight: 15 },
  
  // 1x2, 2x1
  { id: '1x2', grid: [[1, 1]], weight: 10 },
  { id: '2x1', grid: [[1], [1]], weight: 10 },
  
  // 1x3, 3x1
  { id: '1x3', grid: [[1, 1, 1]], weight: 8 },
  { id: '3x1', grid: [[1], [1], [1]], weight: 8 },
  
  // 1x4, 4x1
  { id: '1x4', grid: [[1, 1, 1, 1]], weight: 5 },
  { id: '4x1', grid: [[1], [1], [1], [1]], weight: 5 },

  // 1x5, 5x1
  { id: '1x5', grid: [[1, 1, 1, 1, 1]], weight: 3 },
  { id: '5x1', grid: [[1], [1], [1], [1], [1]], weight: 3 },

  // 2x2
  { id: '2x2', grid: [[1, 1], [1, 1]], weight: 8 },

  // 3x3
  { id: '3x3', grid: [[1, 1, 1], [1, 1, 1], [1, 1, 1]], weight: 4 },

  // L-Shapes (Small 2x2)
  { id: 'L_sm_1', grid: [[1, 0], [1, 1]], weight: 6 },
  { id: 'L_sm_2', grid: [[0, 1], [1, 1]], weight: 6 },
  { id: 'L_sm_3', grid: [[1, 1], [1, 0]], weight: 6 },
  { id: 'L_sm_4', grid: [[1, 1], [0, 1]], weight: 6 },

  // L-Shapes (Medium 3x3)
  { id: 'L_md_1', grid: [[1, 0, 0], [1, 0, 0], [1, 1, 1]], weight: 4 },
  { id: 'L_md_2', grid: [[0, 0, 1], [0, 0, 1], [1, 1, 1]], weight: 4 },
  { id: 'L_md_3', grid: [[1, 1, 1], [1, 0, 0], [1, 0, 0]], weight: 4 },
  { id: 'L_md_4', grid: [[1, 1, 1], [0, 0, 1], [0, 0, 1]], weight: 4 },

  // T-Shapes
  { id: 'T_1', grid: [[1, 1, 1], [0, 1, 0]], weight: 5 },
  { id: 'T_2', grid: [[0, 1, 0], [1, 1, 1]], weight: 5 },
  { id: 'T_3', grid: [[1, 0], [1, 1], [1, 0]], weight: 5 },
  { id: 'T_4', grid: [[0, 1], [1, 1], [0, 1]], weight: 5 },

  // Z and S shapes
  { id: 'Z_1', grid: [[1, 1, 0], [0, 1, 1]], weight: 4 },
  { id: 'S_1', grid: [[0, 1, 1], [1, 1, 0]], weight: 4 },
  { id: 'Z_2', grid: [[1, 0], [1, 1], [0, 1]], weight: 4 },
  { id: 'S_2', grid: [[0, 1], [1, 1], [1, 0]], weight: 4 },

  // Cross shape
  { id: 'Cross', grid: [[0, 1, 0], [1, 1, 1], [0, 1, 0]], weight: 2 },
];

export const getRandomBlocks = (count = 3) => {
  const blocks = [];
  const totalWeight = SHAPE_DEFINITIONS.reduce((sum, def) => sum + def.weight, 0);

  for (let i = 0; i < count; i++) {
    let randomVal = Math.random() * totalWeight;
    let selectedDef = SHAPE_DEFINITIONS[0];
    
    for (const def of SHAPE_DEFINITIONS) {
      if (randomVal < def.weight) {
        selectedDef = def;
        break;
      }
      randomVal -= def.weight;
    }

    const randomColor = BLOCK_COLORS[Math.floor(Math.random() * BLOCK_COLORS.length)];
    
    // Create an instance of the block
    blocks.push({
      id: `block-${Date.now()}-${i}-${Math.random()}`,
      shapeId: selectedDef.id,
      grid: selectedDef.grid,
      color: randomColor,
      width: selectedDef.grid[0].length,
      height: selectedDef.grid.length
    });
  }

  return blocks;
};

export const rotateBlockClockwise = (block) => {
  if (!block) return null;
  const H = block.grid.length;
  const W = block.grid[0].length;
  
  // Create a new grid with dimensions W x H
  const newGrid = Array.from({ length: W }, () => Array(H).fill(0));
  
  for (let r = 0; r < H; r++) {
    for (let c = 0; c < W; c++) {
      newGrid[c][H - 1 - r] = block.grid[r][c];
    }
  }
  
  return {
    ...block,
    grid: newGrid,
    width: H,
    height: W
  };
};
