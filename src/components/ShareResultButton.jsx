import { useState } from 'react';

const ShareResultButton = ({ title, summary, urlHash = '' }) => {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}${urlHash ? `#${urlHash}` : ''}`
      : `https://games.11mosswood.us/${urlHash ? `#${urlHash}` : ''}`;

  const fullText = `${title}\n${summary}\nPlay free at ${shareUrl}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="share-result-wrap">
      <button
        type="button"
        className="btn-share-result"
        onClick={() => setOpen((o) => !o)}
      >
        {open ? 'Hide Share Preview' : '📤 Share Result'}
      </button>

      {open && (
        <div className="share-preview-card" role="region" aria-label="Share preview">
          <div className="share-preview-header">
            <span className="share-preview-badge">TripoFisch Arcade · Share Preview</span>
          </div>
          <pre className="share-preview-body">{fullText}</pre>
          <div className="share-preview-actions">
            <button type="button" className="btn-copy-share" onClick={handleCopy}>
              {copied ? '✓ Copied to Clipboard!' : '📋 Copy Share Text'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShareResultButton;
