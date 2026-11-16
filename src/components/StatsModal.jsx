import { GAMES_CATALOG } from '../gameCatalog';

const StatsModal = ({ open, stats, onPlayGame, onClose }) => {
  if (!open) return null;

  const totalPlayed = Object.values(stats).reduce((sum, s) => sum + (s?.played || 0), 0);

  return (
    <div
      className="arcade-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Arcade Scoreboard and Stats"
      onClick={onClose}
    >
      <div className="arcade-modal-card stats-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="arcade-modal-header">
          <div>
            <h2 className="arcade-modal-title">📊 Arcade Scoreboard</h2>
            <p className="arcade-modal-sub">
              Your local play history, wins, and personal bests across all six Trish&apos;s Games.
            </p>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close scoreboard">
            ✕
          </button>
        </div>

        {totalPlayed === 0 ? (
          <div className="empty-state-box">
            <div className="empty-state-icon" aria-hidden="true">🏆</div>
            <div className="empty-state-title">No rounds recorded yet</div>
            <p className="empty-state-desc">
              This scoreboard tracks games played, victories, and personal best scores automatically on your device as you finish rounds.
            </p>
            <button
              type="button"
              className="btn-primary empty-state-cta"
              onClick={() => {
                onClose();
                onPlayGame('bricksmack');
              }}
            >
              🧱 Play BrickSmack Now
            </button>
            <div className="empty-state-sample-card">
              <div className="empty-state-sample-label">Sample Scoreboard Entry</div>
              <div className="sample-stats-preview">
                <span>🧱 <strong>BrickSmack</strong> (Pistol Shrimp)</span>
                <span>Played: 3</span>
                <span>Best: 1,450 pts</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="stats-table-wrap">
            <table className="stats-table">
              <thead>
                <tr>
                  <th>Game</th>
                  <th>Marine Identity</th>
                  <th>Played</th>
                  <th>Wins</th>
                  <th>Best Score</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {GAMES_CATALOG.map((g) => {
                  const s = stats[g.key] || { played: 0, wins: 0, bestScore: null };
                  const bestText =
                    s.bestScore !== null && s.bestScore !== undefined
                      ? g.key === 'wordwager'
                        ? `$${s.bestScore}`
                        : `${s.bestScore.toLocaleString()} pts`
                      : '—';
                  return (
                    <tr key={g.key}>
                      <td data-label="Game">
                        <span className="stats-game-cell">
                          <span aria-hidden="true">{g.icon}</span>
                          <strong>{g.title}</strong>
                        </span>
                      </td>
                      <td data-label="Marine Identity">{g.animal}</td>
                      <td data-label="Played">{s.played || 0}</td>
                      <td data-label="Wins">{s.wins || 0}</td>
                      <td data-label="Best Score">{bestText}</td>
                      <td data-label="Action">
                        <button
                          type="button"
                          className="stats-play-btn"
                          onClick={() => {
                            onClose();
                            onPlayGame(g.key);
                          }}
                        >
                          Play →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="arcade-modal-footer">
          <span className="modal-tip">All scores stay on your device — no servers or accounts required.</span>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatsModal;
