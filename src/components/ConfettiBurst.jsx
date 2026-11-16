const PIECES = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  left: `${(i * 4.2 + (i % 3) * 2) % 100}%`,
  delay: `${(i % 6) * 0.06}s`,
  duration: `${1.1 + (i % 4) * 0.22}s`,
  color: ['#fbbf24', '#34d399', '#60a5fa', '#f472b6', '#a78bfa', '#fb7185'][i % 6],
  drift: `${((i % 2 === 0 ? 1 : -1) * (15 + (i % 5) * 12))}px`,
}));

const ConfettiBurst = ({ active, reducedMotion = false }) => {
  if (!active || reducedMotion) return null;

  return (
    <div className="confetti-layer" aria-hidden="true">
      {PIECES.map((p) => (
        <span
          key={p.id}
          className="confetti-piece"
          style={{
            left: p.left,
            backgroundColor: p.color,
            animationDelay: p.delay,
            animationDuration: p.duration,
            '--confetti-drift': p.drift,
          }}
        />
      ))}
    </div>
  );
};

export default ConfettiBurst;
