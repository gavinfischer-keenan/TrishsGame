/**
 * SlippedMyMindMenu.jsx
 * Splash / rules screen for Slipped My Mind.
 */

const DEMO_COLOURS = [
  { bg: '#dc2626', hi: '#f87171', sh: '#7f1d1d' },
  { bg: '#15803d', hi: '#4ade80', sh: '#052e16' },
  { bg: '#1d4ed8', hi: '#60a5fa', sh: '#1e3a8a' },
  { bg: '#d97706', hi: '#fcd34d', sh: '#713f12' },
  { bg: '#1f2937', hi: '#4b5563', sh: '#030712' },
  { bg: '#e2e8f0', hi: '#ffffff', sh: '#94a3b8' },
];

const DemoBall = ({ col, size = 50 }) => (
  <div style={{
    width: size, height: size,
    borderRadius: '50%',
    background: `radial-gradient(circle at 33% 28%, ${col.hi}, ${col.bg} 52%, ${col.sh})`,
    boxShadow: '0 4px 14px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.25)',
    flexShrink: 0,
  }} />
);

const SlippedMyMindMenu = ({ onPlay, onBack }) => (
  <div className="smm-menu">
    <div className="smm-menu-content">
      <button className="btn-back-home" onClick={onBack}>← Back to Games</button>

      {/* Decorative balls */}
      <div className="smm-menu-hero">
        {DEMO_COLOURS.map((c, i) => <DemoBall key={i} col={c} />)}
      </div>

      <h1 className="smm-menu-title">Slipped My Mind</h1>
      <p className="smm-menu-tagline">A modern take on the classic code-breaking game</p>

      <p className="smm-menu-desc">
        The computer has chosen a secret <strong>5-ball code</strong> from
        6 colours. You have <strong>10 guesses</strong> to crack it.
        After each guess you&apos;ll learn:
      </p>

      {/* Legend */}
      <div className="smm-menu-legend">
        <div className="smm-legend-item">
          <div className="smm-peg smm-peg-exact smm-peg-lg" />
          <div>
            <strong>Dark peg</strong>
            <span> — right colour, right position</span>
          </div>
        </div>
        <div className="smm-legend-item">
          <div className="smm-peg smm-peg-close smm-peg-lg" />
          <div>
            <strong>Light peg</strong>
            <span> — right colour, wrong position</span>
          </div>
        </div>
        <div className="smm-legend-item">
          <div className="smm-peg smm-peg-none smm-peg-lg" />
          <div>
            <strong>Empty</strong>
            <span> — colour not in the code at all</span>
          </div>
        </div>
      </div>

      <div className="smm-menu-tip">
        💡 Colours <em>can</em> repeat in the secret code!
      </div>

      <button className="smm-play-btn" onClick={onPlay}>
        Start Guessing →
      </button>
    </div>
  </div>
);

export default SlippedMyMindMenu;
