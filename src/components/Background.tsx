import { useMemo } from 'react';

export function Background() {
  const leaves = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        duration: 18 + Math.random() * 14,
        delay: Math.random() * 20,
        size: 14 + Math.random() * 12,
        hue: ['#9DBF9E', '#F6D98B', '#F7B79A', '#C5B3E6'][i % 4],
        rotate: Math.random() * 360,
      })),
    [],
  );

  const fireflies = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        duration: 5 + Math.random() * 5,
        delay: Math.random() * 5,
        size: 3 + Math.random() * 3,
      })),
    [],
  );

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
      {leaves.map((l) => (
        <div
          key={l.id}
          className="absolute animate-floatleaf"
          style={{
            left: `${l.left}%`,
            top: '-10vh',
            animationDuration: `${l.duration}s`,
            animationDelay: `${l.delay}s`,
          }}
        >
          <svg width={l.size} height={l.size} viewBox="0 0 20 20" style={{ transform: `rotate(${l.rotate}deg)` }}>
            <path d="M10 2 Q4 8 10 18 Q16 8 10 2 Z" fill={l.hue} opacity="0.4" />
            <path d="M10 4 L10 16" stroke={l.hue} strokeWidth="0.5" opacity="0.3" />
          </svg>
        </div>
      ))}

      {fireflies.map((f) => (
        <div
          key={f.id}
          className="absolute rounded-full animate-firefly"
          style={{
            left: `${f.left}%`,
            top: `${f.top}%`,
            width: f.size,
            height: f.size,
            backgroundColor: '#F6D98B',
            boxShadow: '0 0 8px 2px rgba(246,217,139,0.6)',
            animationDuration: `${f.duration}s`,
            animationDelay: `${f.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
