import { useState } from 'react';
import LevelSelect from './LevelSelect';
import RiverGame from './RiverGame';

/**
 * BuildMeARiver.jsx
 * Top-level wrapper for the Build Me a River game.
 * Manages navigation between level-select and playing.
 */
const BuildMeARiver = ({ settings, onExit, onRecordResult }) => {
  const [screen, setScreen] = useState('level-select');
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [selectedSize, setSelectedSize] = useState(() => settings?.defaultRiverSize || 'stream');

  const handleSelectLevel = (level, sizeName) => {
    setSelectedLevel(level);
    setSelectedSize(sizeName);
    setScreen('playing');
  };

  const handleExitGame = () => {
    setScreen('level-select');
    setSelectedLevel(null);
  };

  if (screen === 'playing' && selectedLevel) {
    return (
      <RiverGame
        level={selectedLevel}
        sizeName={selectedSize}
        settings={settings}
        onExit={handleExitGame}
        onRecordResult={onRecordResult}
      />
    );
  }

  return (
    <LevelSelect
      initialSize={selectedSize}
      onSelectLevel={handleSelectLevel}
      onBack={onExit}
    />
  );
};

export default BuildMeARiver;
