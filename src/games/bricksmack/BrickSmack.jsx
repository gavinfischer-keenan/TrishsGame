import { useState } from 'react';
import BrickSmackMenu from './BrickSmackMenu';
import BrickSmackGame from './BrickSmackGame';

const BrickSmack = ({ settings, onExit, onRecordResult }) => {
  const [gameState, setGameState] = useState({
    isPlaying: false,
    mode: null,
    gridSize: settings?.defaultBrickGrid || 8,
  });

  const handleStartGame = (mode, gridSize) => {
    setGameState({ isPlaying: true, mode, gridSize });
  };

  const handleExitGame = () => {
    setGameState({
      isPlaying: false,
      mode: null,
      gridSize: settings?.defaultBrickGrid || 8,
    });
  };

  return (
    <>
      {gameState.isPlaying ? (
        <BrickSmackGame
          mode={gameState.mode}
          gridSize={gameState.gridSize}
          settings={settings}
          onExit={handleExitGame}
          onRecordResult={onRecordResult}
        />
      ) : (
        <BrickSmackMenu
          defaultGridSize={settings?.defaultBrickGrid || 8}
          onStartGame={handleStartGame}
          onBack={onExit}
        />
      )}
    </>
  );
};

export default BrickSmack;
