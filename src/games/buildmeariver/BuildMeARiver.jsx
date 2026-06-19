import { useState } from 'react';
import LevelSelect from './LevelSelect';
import RiverGame from './RiverGame';

/**
 * BuildMeARiver.jsx
 * Top-level wrapper for the Build Me a River game.
 * Manages navigation between level-select and playing.
 *
 * Props:
 *   onExit - () => void  (return to Trish's Games home)
 */

const BuildMeARiver = ({ onExit }) => {
  const [screen, setScreen] = useState('level-select'); // 'level-select' | 'playing'
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [selectedSize, setSelectedSize] = useState('stream');

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
        onExit={handleExitGame}
      />
    );
  }

  return (
    <LevelSelect
      onSelectLevel={handleSelectLevel}
      onBack={onExit}
    />
  );
};

export default BuildMeARiver;
