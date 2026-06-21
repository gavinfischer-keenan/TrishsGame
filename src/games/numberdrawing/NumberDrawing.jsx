import { useState } from 'react';
import NumberDrawingMenu from './NumberDrawingMenu';
import NumberDrawingGame from './NumberDrawingGame';
import NumberDrawingEditor from './NumberDrawingEditor';

const NumberDrawing = ({ onExit }) => {
  const [view, setView] = useState('menu'); // 'menu', 'game', 'editor'
  const [activeLevel, setActiveLevel] = useState(null);

  const handlePlayLevel = (levelData) => {
    setActiveLevel(levelData);
    setView('game');
  };

  const handleExitGame = () => {
    setActiveLevel(null);
    setView('menu');
  };

  return (
    <>
      {view === 'menu' && (
        <NumberDrawingMenu 
          onPlayLevel={handlePlayLevel} 
          onOpenEditor={() => setView('editor')} 
          onBack={onExit} 
        />
      )}
      {view === 'game' && (
        <NumberDrawingGame 
          levelData={activeLevel} 
          onExit={handleExitGame} 
        />
      )}
      {view === 'editor' && (
        <NumberDrawingEditor 
          onTestPlay={handlePlayLevel} 
          onBack={() => setView('menu')} 
        />
      )}
    </>
  );
};

export default NumberDrawing;
