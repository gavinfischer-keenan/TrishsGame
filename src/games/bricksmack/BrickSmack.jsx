import { useState } from 'react';
import BrickSmackMenu from './BrickSmackMenu';
import BrickSmackGame from './BrickSmackGame';

const BrickSmack = ({ onExit }) => {
  const [gameState, setGameState] = useState({
    isPlaying: false,
    mode: null,
    gridSize: 8
  });

  const handleStartGame = (mode, gridSize) => {
    setGameState({ isPlaying: true, mode, gridSize });
  };

  const handleExitGame = () => {
    setGameState({ isPlaying: false, mode: null, gridSize: 8 });
  };

  return (
    <>
      {gameState.isPlaying ? (
        <BrickSmackGame
          mode={gameState.mode}
          gridSize={gameState.gridSize}
          onExit={handleExitGame}
        />
      ) : (
        <BrickSmackMenu onStartGame={handleStartGame} onBack={onExit} />
      )}
    </>
  );
};

export default BrickSmack;
