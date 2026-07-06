import { useState } from 'react';
import HomeScreen from './components/HomeScreen';
import BrickSmack from './games/bricksmack/BrickSmack';
import BuildMeARiver from './games/buildmeariver/BuildMeARiver';
import SlippedMyMind from './games/slippedmymind/SlippedMyMind';
import NumberDrawing from './games/numberdrawing/NumberDrawing';
import Battleship from './games/battleship/Battleship';
import WordWager from './games/wordwager/WordWager';
import Connect4 from './games/connect4/Connect4';

function App() {
  const [currentGame, setCurrentGame] = useState(null);
  // null | 'bricksmack' | 'buildmeariver' | 'slippedmymind' | 'numberdrawing' | 'battleship' | 'wordwager' | 'connect4'

  const exit = () => setCurrentGame(null);

  return (
    <div className="app-root">
      {currentGame === 'bricksmack'    && <BrickSmack    onExit={exit} />}
      {currentGame === 'buildmeariver' && <BuildMeARiver onExit={exit} />}
      {currentGame === 'slippedmymind' && <SlippedMyMind onExit={exit} />}
      {currentGame === 'numberdrawing' && <NumberDrawing onExit={exit} />}
      {currentGame === 'battleship'    && <Battleship    onExit={exit} />}
      {currentGame === 'wordwager'     && <WordWager     onExit={exit} />}
      {currentGame === 'connect4'      && <Connect4      onExit={exit} />}
      {!currentGame && <HomeScreen onSelectGame={setCurrentGame} />}
    </div>
  );
}

export default App;
