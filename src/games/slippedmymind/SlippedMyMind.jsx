import { useState } from 'react';
import SlippedMyMindMenu from './SlippedMyMindMenu';
import SlippedMyMindGame from './SlippedMyMindGame';

/**
 * SlippedMyMind.jsx — Top-level wrapper for the Slipped My Mind game.
 * Routes between the menu/rules screen and the live game.
 */
const SlippedMyMind = ({ settings, onExit, onRecordResult }) => {
  const [playing, setPlaying] = useState(false);

  return playing ? (
    <SlippedMyMindGame
      settings={settings}
      onExit={() => setPlaying(false)}
      onRecordResult={onRecordResult}
    />
  ) : (
    <SlippedMyMindMenu onPlay={() => setPlaying(true)} onBack={onExit} />
  );
};

export default SlippedMyMind;
