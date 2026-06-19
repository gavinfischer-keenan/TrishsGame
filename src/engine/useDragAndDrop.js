import { useState, useCallback, useEffect } from 'react';
import { rotateBlockClockwise } from './BlockDefinitions';

/**
 * Isolated Drag and Drop Logic
 * Handles global pointer events to ensure smooth dragging across the screen.
 */
export const useDragAndDrop = (gridSize, onBlockDrop, rotationEnabled = false) => {
  const [dragState, setDragState] = useState({
    isDragging: false,
    block: null,
    pointerX: 0,
    pointerY: 0,
    pctX: 0,
    pctY: 0,
    sourceIndex: -1,
  });

  const [boardRect, setBoardRect] = useState(null);

  const startDrag = useCallback((e, block, sourceIndex) => {
    e.preventDefault();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    
    // Calculate proportional click offset inside the tray block
    const rect = e.currentTarget.getBoundingClientRect();
    const pctX = rect.width > 0 ? (clientX - rect.left) / rect.width : 0.5;
    const pctY = rect.height > 0 ? (clientY - rect.top) / rect.height : 0.5;

    setDragState({
      isDragging: true,
      block,
      pointerX: clientX,
      pointerY: clientY,
      pctX,
      pctY,
      sourceIndex,
    });
  }, []);

  const handlePointerMove = useCallback((e) => {
    if (!dragState.isDragging || !dragState.block) return;

    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);

    setDragState(prev => ({ ...prev, pointerX: clientX, pointerY: clientY }));
  }, [dragState.isDragging, dragState.block]);

  const cellWidth = boardRect ? boardRect.width / gridSize : 35;
  const cellHeight = boardRect ? boardRect.height / gridSize : 35;

  const dragOffsetX = dragState.isDragging && dragState.block
    ? dragState.pctX * (dragState.block.width * cellWidth)
    : 0;
  const dragOffsetY = dragState.isDragging && dragState.block
    ? dragState.pctY * (dragState.block.height * cellHeight)
    : 0;
  const visualShiftY = dragState.isDragging && dragState.block
    ? Math.max(60, cellHeight * 1.2)
    : 0;

  // Derive hoveredCell reactively on render
  let hoveredCell = null;
  if (dragState.isDragging && dragState.block && boardRect) {
    // Position of the block's top-left relative to the board's top-left (with shift)
    const blockTopLeftX = (dragState.pointerX - dragOffsetX) - boardRect.left;
    const blockTopLeftY = (dragState.pointerY - dragOffsetY - visualShiftY) - boardRect.top;

    // Use Math.round so it snaps when the block is more than halfway over the cell
    const col = Math.round(blockTopLeftX / cellWidth);
    const row = Math.round(blockTopLeftY / cellHeight);

    if (row >= -dragState.block.height && row < gridSize && col >= -dragState.block.width && col < gridSize) {
       hoveredCell = { row, col };
    }
  }

  const handlePointerUp = useCallback(() => {
    if (!dragState.isDragging) return;

    if (hoveredCell && dragState.block) {
      onBlockDrop(dragState.block, dragState.sourceIndex, hoveredCell.row, hoveredCell.col);
    }

    setDragState({
      isDragging: false,
      block: null,
      pointerX: 0,
      pointerY: 0,
      pctX: 0,
      pctY: 0,
      sourceIndex: -1
    });
  }, [dragState.isDragging, dragState.block, hoveredCell, onBlockDrop, dragState.sourceIndex]);

  // Keyboard rotation listener (Space bar)
  useEffect(() => {
    if (dragState.isDragging && rotationEnabled) {
      const handleKeyDown = (e) => {
        if (e.code === 'Space') {
          e.preventDefault();
          setDragState(prev => {
            if (!prev.isDragging || !prev.block) return prev;
            
            // Perform 90-degree clockwise rotation
            const rotated = rotateBlockClockwise(prev.block);
            
            // Compute new click percentages mapping to the rotated shape
            const newPctX = 1 - prev.pctY;
            const newPctY = prev.pctX;
            
            return {
              ...prev,
              block: rotated,
              pctX: newPctX,
              pctY: newPctY
            };
          });
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [dragState.isDragging, rotationEnabled]);

  // Pointer event listeners setup
  useEffect(() => {
    if (dragState.isDragging) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
      window.addEventListener('touchmove', handlePointerMove, { passive: false });
      window.addEventListener('touchend', handlePointerUp);
    }
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [dragState.isDragging, handlePointerMove, handlePointerUp]);

  return {
    dragState,
    hoveredCell,
    startDrag,
    setBoardRect,
    boardRect,
    cellWidth,
    cellHeight,
    dragOffsetX,
    dragOffsetY,
    visualShiftY,
  };
};
