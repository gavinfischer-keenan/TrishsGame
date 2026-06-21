import { useState } from 'react';
import { parseLevelGrid } from './levels';

const NumberDrawingEditor = ({ onTestPlay, onBack }) => {
  const [text, setText] = useState('');
  const [error, setError] = useState(null);

  const handleTest = () => {
    try {
      if (!text.trim()) {
        throw new Error("Input is empty.");
      }
      const lines = text.split('\n').filter(l => l.trim().length > 0);
      const parsed = parseLevelGrid(lines);
      
      // Basic validation
      const hasPlayable = parsed.some(r => r.some(c => c.type === 'playable'));
      if (!hasPlayable) {
        throw new Error("Grid contains no playable numbers (0-9).");
      }

      onTestPlay(parsed);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="nd-editor">
      <div className="nd-editor-header">
        <button className="btn-back-home" onClick={onBack}>← Back</button>
        <h2>Level Editor</h2>
      </div>

      <div className="nd-editor-content">
        <p>
          Paste your ASCII art level below. Use spaces <code> </code> or dots <code>.</code> for empty boundaries.
          Use numbers <code>0-9</code> for the playable art.
        </p>

        <textarea 
          className="nd-textarea"
          rows={15}
          value={text}
          onChange={(e) => { setText(e.target.value); setError(null); }}
          placeholder={"  020  \n 25522 \n2     2\n..."}
        />

        {error && <div className="nd-error">{error}</div>}

        <button className="btn-primary" onClick={handleTest}>
          Test Play Level
        </button>
      </div>
    </div>
  );
};

export default NumberDrawingEditor;
