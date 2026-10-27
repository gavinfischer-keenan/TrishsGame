import {resolveGame} from './gameRoutes.js';
import { useState, useEffect } from 'react';
import HomeScreen from './components/HomeScreen';
import BrickSmack from './games/bricksmack/BrickSmack';
import BuildMeARiver from './games/buildmeariver/BuildMeARiver';
import SlippedMyMind from './games/slippedmymind/SlippedMyMind';
import Battleship from './games/battleship/Battleship';
import WordWager from './games/wordwager/WordWager';
import Connect4 from './games/connect4/Connect4';

function getGameFromHash(){return resolveGame(window.location.hash);}

function App() {
  const [currentGame, setCurrentGame] = useState(() => getGameFromHash());

  // Sync state with URL hash
  useEffect(() => {
    const onHashChange = () => {
      setCurrentGame(getGameFromHash());
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const handleSelectGame = (gameKey) => {
    window.location.hash = gameKey;
    setCurrentGame(gameKey);
  };

  const handleExit = () => {
    // Remove hash without scrolling
    history.pushState('', document.title, window.location.pathname + window.location.search);
    setCurrentGame(null);
  };

  return (
    <div className="app-root">
      {currentGame === 'bricksmack'    && <BrickSmack    onExit={handleExit} />}
      {currentGame === 'buildmeariver' && <BuildMeARiver onExit={handleExit} />}
      {currentGame === 'slippedmymind' && <SlippedMyMind onExit={handleExit} />}
      {currentGame === 'battleship'    && <Battleship    onExit={handleExit} />}
      {currentGame === 'wordwager'     && <WordWager     onExit={handleExit} />}
      {currentGame === 'connect4'      && <Connect4      onExit={handleExit} />}
      {!currentGame && <HomeScreen onSelectGame={handleSelectGame} />}
    </div>
  );
}

export default App;
