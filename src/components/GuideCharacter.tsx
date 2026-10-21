import { useState, useEffect } from 'react';
import { Creature } from './Creature';
import { CREATURE_MAP } from '@/data/creatures';
import { useStore } from '@/store';

type Props = {
  size?: number;
  onTap?: () => void;
  message?: string;
  className?: string;
};

export function GuideCharacter({ size = 72, onTap, message, className = '' }: Props) {
  const [tapCount, setTapCount] = useState(0);
  const [parading, setParading] = useState(false);
  const reduceMotion = useStore((s) => s.reduceMotion);
  const creature = CREATURE_MAP['mossling'];

  useEffect(() => {
    if (tapCount >= 5) {
      setParading(true);
      setTapCount(0);
      const t = setTimeout(() => setParading(false), 6000);
      return () => clearTimeout(t);
    }
  }, [tapCount]);

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => {
          setTapCount((c) => c + 1);
          onTap?.();
        }}
        className="block rounded-full hover:scale-105 transition-transform focus:outline-none focus:ring-2 focus:ring-sage focus:ring-offset-2 focus:ring-offset-cream"
        aria-label="Moodex guide. Tap 5 times for a surprise."
      >
        <Creature
          creature={creature}
          size={size}
          interactive={!reduceMotion}
          state="familiar"
          showSparkles={false}
        />
      </button>

      {message && (
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 max-w-[200px]">
          <div className="paper-card px-3 py-2 text-sm text-ink-soft font-body relative">
            <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-cream rotate-45 border-l border-b border-[rgba(59,47,47,0.10)]" />
            {message}
          </div>
        </div>
      )}

      {parading && <Parade />}
    </div>
  );
}

function Parade() {
  const entries = useStore((s) => s.entries);
  const discovered = [...new Set(entries.map((e) => e.speciesId))].slice(0, 12);

  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden" aria-hidden>
      <div className="flex gap-8 animate-[floatleaf_6s_linear] items-center" style={{ animation: 'parade 6s linear', top: '40%' }}>
        {discovered.map((id, i) => {
          const c = CREATURE_MAP[id];
          if (!c) return null;
          return (
            <div
              key={id}
              className="opacity-90"
              style={{ animation: `parade-float 1.5s ease-in-out ${i * 0.1}s infinite alternate` }}
            >
              <Creature creature={c} size={60} interactive={false} />
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes parade { from { transform: translateX(-120%); } to { transform: translateX(120vw); } }
        @keyframes parade-float { from { transform: translateY(0); } to { transform: translateY(-12px); } }
      `}</style>
    </div>
  );
}
