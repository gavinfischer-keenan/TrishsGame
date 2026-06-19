import { useState } from 'react';
import Menu from './components/Menu';
import Game from './components/Game';

function App() {
  const [gameState, setGameState] = useState({
    isPlaying: false,
    mode: null,
    gridSize: 8
  });

  const handleStartGame = (mode, gridSize) => {
    setGameState({
      isPlaying: true,
      mode,
      gridSize
    });
  };

  const handleExitGame = () => {
    setGameState({
      isPlaying: false,
      mode: null,
      gridSize: 8
    });
  };

  return (
    <div className="app-root">
      {gameState.isPlaying ? (
        <Game 
          mode={gameState.mode} 
          gridSize={gameState.gridSize} 
          onExit={handleExitGame} 
        />
      ) : (
        <Menu onStartGame={handleStartGame} />
      )}
    </div>
  );
}

export default App;
