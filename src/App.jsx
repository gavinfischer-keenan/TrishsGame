import { useState } from 'react';
import HomeScreen from './components/HomeScreen';
import BrickSmack from './games/bricksmack/BrickSmack';
import BuildMeARiver from './games/buildmeariver/BuildMeARiver';

function App() {
  const [currentGame, setCurrentGame] = useState(null); // null | 'bricksmack' | 'buildmeariver'

  const handleSelectGame = (gameKey) => setCurrentGame(gameKey);
  const handleExitGame = () => setCurrentGame(null);

  return (
    <div className="app-root">
      {currentGame === 'bricksmack' && (
        <BrickSmack onExit={handleExitGame} />
      )}
      {currentGame === 'buildmeariver' && (
        <BuildMeARiver onExit={handleExitGame} />
      )}
      {!currentGame && (
        <HomeScreen onSelectGame={handleSelectGame} />
      )}
    </div>
  );
}

export default App;
