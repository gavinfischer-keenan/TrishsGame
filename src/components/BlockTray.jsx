
const BlockTray = ({ blocks, onDragStart, draggedSourceIndex, onRotateBlock, mode }) => {
  return (
    <div className="block-tray">
      {blocks.map((block, index) => {
        if (!block) {
          // Empty slot where a block was used
          return <div key={`empty-${index}`} className="tray-slot empty" />;
        }

        const isBeingDragged = index === draggedSourceIndex;

        return (
          <div key={block.id} className="tray-slot">
            {mode === 'Rotate on this' && (
              <button 
                className="btn-rotate-tray" 
                onClick={(e) => {
                  e.stopPropagation();
                  onRotateBlock(index);
                }}
                title="Rotate Block (90° Clockwise)"
              >
                ↻
              </button>
            )}
            <div 
              className={`tray-block ${isBeingDragged ? 'dragging' : ''}`}
              style={{
                gridTemplateColumns: `repeat(${block.width}, 1fr)`,
                gridTemplateRows: `repeat(${block.height}, 1fr)`
              }}
              onPointerDown={(e) => onDragStart(e, block, index)}
            >
              {block.grid.flatMap((row, r) => 
                row.map((val, c) => (
                  <div 
                    key={`${r}-${c}`} 
                    className={`cell ${val ? 'filled' : 'empty'}`} 
                    style={{ backgroundColor: val ? block.color : 'transparent' }}
                  >
                    {val === 1 && <div className="cell-inner" />}
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default BlockTray;
