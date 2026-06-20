import { useState } from 'react';
import HomeScreen from './components/HomeScreen';
import BrickSmack from './games/bricksmack/BrickSmack';
import BuildMeARiver from './games/buildmeariver/BuildMeARiver';
import SlippedMyMind from './games/slippedmymind/SlippedMyMind';

function App() {
  const [currentGame, setCurrentGame] = useState(null);
  // null | 'bricksmack' | 'buildmeariver' | 'slippedmymind'

  const exit = () => setCurrentGame(null);

  return (
    <div className="app-root">
      {currentGame === 'bricksmack'    && <BrickSmack    onExit={exit} />}
      {currentGame === 'buildmeariver' && <BuildMeARiver onExit={exit} />}
      {currentGame === 'slippedmymind' && <SlippedMyMind onExit={exit} />}
      {!currentGame && <HomeScreen onSelectGame={setCurrentGame} />}
    </div>
  );
}

export default App;
