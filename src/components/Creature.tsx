import { useRef, useState, useEffect } from 'react';
import type { Creature, BodyShape, EarType, TailType, Expression, Accessory } from '@/types';

type Props = {
  creature: Creature;
  size?: number;
  state?: 'discovered' | 'familiar' | 'crowned';
  interactive?: boolean;
  showSparkles?: boolean;
  className?: string;
};

const EYE_BASE_Y: Record<BodyShape, number> = {
  blob: 48, round: 46, egg: 44, oval: 46, tall: 42, fluffy: 48, cloud: 50, winged: 48,
};

export function Creature({
  creature,
  size = 200,
  state = 'discovered',
  interactive = true,
  showSparkles = false,
  className = '',
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
  }, []);

  useEffect(() => {
    if (!interactive || reduced) return;
    const svg = svgRef.current;
    if (!svg) return;

    const handleMove = (e: MouseEvent) => {
      const rect = svg.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2 + rect.height * 0.08;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);
      const max = 3;
      const factor = Math.min(max, dist / 120) * Math.sign(dx || 1) * 0.001 * Math.min(dist, 120);
      setEyeOffset({
        x: Math.max(-max, Math.min(max, (dx / Math.max(dist, 1)) * Math.min(max, dist / 40))),
        y: Math.max(-max, Math.min(max, (dy / Math.max(dist, 1)) * Math.min(max, dist / 40))),
      });
      void factor;
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, [interactive, reduced]);

  const { body, face, accessory, palette } = creature;
  const bodyY = EYE_BASE_Y[body.shape] ?? 48;

  return (
    <div className={`relative inline-block ${className}`} style={{ width: size, height: size }}>
      <svg
        ref={svgRef}
        viewBox="0 0 120 120"
        width={size}
        height={size}
        style={{ overflow: 'visible' }}
        role="img"
        aria-label={`${creature.name}, a creature for ${creature.emotion.toLowerCase()}`}
      >
        <defs>
          <radialGradient id={`grad-${creature.id}`} cx="40%" cy="35%" r="70%">
            <stop offset="0%" stopColor={palette.primary} stopOpacity="1" />
            <stop offset="100%" stopColor={palette.secondary} stopOpacity="1" />
          </radialGradient>
          <filter id={`soft-${creature.id}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodColor="#3B2F2F" floodOpacity="0.15" />
          </filter>
        </defs>

        <g
          className={reduced ? '' : 'animate-breathe'}
          style={{ transformOrigin: '60px 65px' }}
          filter={`url(#soft-${creature.id})`}
        >
          {/* wings behind body for winged shape */}
          {body.shape === 'winged' && <Wings palette={palette} />}

          {/* tail */}
          <Tail type={body.tail} color={palette.secondary} />

          {/* ears behind body */}
          <Ears type={body.ears} color={palette.secondary} bodyY={bodyY} />

          {/* body */}
          <Body shape={body.shape} color={`url(#grad-${creature.id})`} belly={body.belly} />

          {/* face */}
          <Face
            expression={face.expression}
            bodyY={bodyY}
            eyeColor={face.eyeColor || '#3B2F2F'}
            cheekColor={face.cheekColor}
            eyeOffset={eyeOffset}
            reduced={reduced}
          />

          {/* accessory */}
          <AccessoryEl type={accessory} palette={palette} state={state} bodyY={bodyY} />
        </g>
      </svg>

      {showSparkles && !reduced && (
        <>
          <Sparkle className="top-2 left-2" delay={0} />
          <Sparkle className="top-6 right-4" delay={0.3} />
          <Sparkle className="bottom-8 left-4" delay={0.6} />
          <Sparkle className="bottom-4 right-2" delay={0.9} />
        </>
      )}
    </div>
  );
}

function Sparkle({ className = '', delay = 0 }: { className?: string; delay?: number }) {
  return (
    <div
      className={`absolute animate-twinkle pointer-events-none ${className}`}
      style={{ animationDelay: `${delay}s` }}
      aria-hidden
    >
      <svg width="20" height="20" viewBox="0 0 20 20">
        <path
          d="M10 0 L12 8 L20 10 L12 12 L10 20 L8 12 L0 10 L8 8 Z"
          fill="#F6D98B"
          opacity="0.9"
        />
      </svg>
    </div>
  );
}

function Body({ shape, color, belly }: { shape: BodyShape; color: string; belly?: string }) {
  const bellyShape = belly && (
    <ellipse cx="60" cy={shape === 'tall' ? 72 : 68} rx={shape === 'tall' ? 16 : 20} ry={shape === 'tall' ? 22 : 16} fill={belly} opacity="0.6" />
  );

  switch (shape) {
    case 'blob':
      return (
        <>
          <path d="M30 70 Q22 50 38 40 Q50 28 60 30 Q70 28 82 40 Q98 50 90 70 Q88 88 60 88 Q32 88 30 70 Z" fill={color} />
          {bellyShape}
        </>
      );
    case 'round':
      return (
        <>
          <circle cx="60" cy="62" r="30" fill={color} />
          {bellyShape}
        </>
      );
    case 'egg':
      return (
        <>
          <ellipse cx="60" cy="62" rx="26" ry="32" fill={color} />
          {bellyShape}
        </>
      );
    case 'oval':
      return (
        <>
          <ellipse cx="60" cy="62" rx="32" ry="26" fill={color} />
          {bellyShape}
        </>
      );
    case 'tall':
      return (
        <>
          <ellipse cx="60" cy="60" rx="22" ry="34" fill={color} />
          {bellyShape}
        </>
      );
    case 'fluffy':
      return (
        <>
          <path
            d="M28 68 Q24 52 34 46 Q36 36 48 38 Q52 28 60 32 Q68 28 72 38 Q84 36 86 46 Q96 52 92 68 Q90 86 60 86 Q30 86 28 68 Z"
            fill={color}
          />
          {bellyShape}
        </>
      );
    case 'cloud':
      return (
        <>
          <path
            d="M26 72 Q22 58 34 56 Q34 44 48 46 Q54 36 64 40 Q76 36 78 48 Q92 48 94 62 Q96 78 82 80 Q78 88 64 86 Q52 90 44 84 Q30 86 26 72 Z"
            fill={color}
          />
          {bellyShape}
        </>
      );
    case 'winged':
      return (
        <>
          <ellipse cx="60" cy="62" rx="22" ry="26" fill={color} />
          {bellyShape}
        </>
      );
  }
}

function Ears({ type, color, bodyY }: { type: EarType; color: string; bodyY: number }) {
  const topY = bodyY - 24;
  switch (type) {
    case 'none':
      return null;
    case 'round':
      return (
        <>
          <circle cx="40" cy={topY} r="8" fill={color} />
          <circle cx="80" cy={topY} r="8" fill={color} />
          <circle cx="40" cy={topY} r="4" fill="#FBF6EC" opacity="0.5" />
          <circle cx="80" cy={topY} r="4" fill="#FBF6EC" opacity="0.5" />
        </>
      );
    case 'pointy':
      return (
        <>
          <path d={`M34 ${topY + 6} L40 ${topY - 12} L48 ${topY + 2} Z`} fill={color} />
          <path d={`M72 ${topY + 2} L80 ${topY - 12} L86 ${topY + 6} Z`} fill={color} />
        </>
      );
    case 'long':
      return (
        <>
          <ellipse cx="38" cy={topY + 2} rx="6" ry="16" fill={color} />
          <ellipse cx="82" cy={topY + 2} rx="6" ry="16" fill={color} />
        </>
      );
    case 'leaf':
      return (
        <>
          <path d={`M36 ${topY + 4} Q36 ${topY - 16} 44 ${topY - 14} Q42 ${topY} 36 ${topY + 4} Z`} fill={color} />
          <path d={`M84 ${topY + 4} Q84 ${topY - 16} 76 ${topY - 14} Q78 ${topY} 84 ${topY + 4} Z`} fill={color} />
        </>
      );
    case 'fin':
      return (
        <>
          <path d={`M38 ${topY + 2} Q34 ${topY - 10} 44 ${topY - 8} Z`} fill={color} />
          <path d={`M82 ${topY + 2} Q86 ${topY - 10} 76 ${topY - 8} Z`} fill={color} />
        </>
      );
    case 'horn':
      return (
        <>
          <path d={`M42 ${topY + 2} L40 ${topY - 14} L46 ${topY} Z`} fill={color} />
          <path d={`M78 ${topY} L80 ${topY - 14} L74 ${topY + 2} Z`} fill={color} />
        </>
      );
  }
}

function Tail({ type, color }: { type: TailType; color: string }) {
  switch (type) {
    case 'none':
      return null;
    case 'round':
      return <circle cx="92" cy="72" r="7" fill={color} />;
    case 'long':
      return <path d="M88 70 Q104 64 100 82" stroke={color} strokeWidth="5" fill="none" strokeLinecap="round" />;
    case 'tuft':
      return (
        <>
          <path d="M88 70 Q98 60 96 76" stroke={color} strokeWidth="4" fill="none" strokeLinecap="round" />
          <circle cx="96" cy="72" r="4" fill={color} />
        </>
      );
    case 'curl':
      return <path d="M88 72 Q104 72 100 60 Q96 54 92 58" stroke={color} strokeWidth="4" fill="none" strokeLinecap="round" />;
    case 'flame':
      return (
        <path d="M88 68 Q96 56 98 48 Q100 56 96 64 Q98 70 88 72 Z" fill={color}>
          {!false && <animate attributeName="opacity" values="0.85;1;0.85" dur="2s" repeatCount="indefinite" />}
        </path>
      );
    case 'wisp':
      return (
        <path d="M88 68 Q96 58 94 48 Q92 42 96 38" stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.7">
          <animate attributeName="opacity" values="0.4;0.8;0.4" dur="3s" repeatCount="indefinite" />
        </path>
      );
  }
}

function Wings({ palette }: { palette: Creature['palette'] }) {
  return (
    <>
      <path d="M34 58 Q14 46 12 64 Q14 76 32 68 Z" fill={palette.secondary} opacity="0.75" />
      <path d="M86 58 Q106 46 108 64 Q106 76 88 68 Z" fill={palette.secondary} opacity="0.75" />
    </>
  );
}

function Face({
  expression,
  bodyY,
  eyeColor,
  cheekColor,
  eyeOffset,
  reduced,
}: {
  expression: Expression;
  bodyY: number;
  eyeColor: string;
  cheekColor?: string;
  eyeOffset: { x: number; y: number };
  reduced: boolean;
}) {
  const eyeY = bodyY - 2;
  const eyeSpacing = 13;

  const cheeks = cheekColor && (
    <>
      <ellipse cx={60 - eyeSpacing - 4} cy={eyeY + 8} rx="5" ry="3" fill={cheekColor} opacity="0.5" />
      <ellipse cx={60 + eyeSpacing + 4} cy={eyeY + 8} rx="5" ry="3" fill={cheekColor} opacity="0.5" />
    </>
  );

  const mouth = (() => {
    switch (expression) {
      case 'happy':
        return <path d={`M${60 - 5} ${eyeY + 14} Q60 ${eyeY + 20} ${60 + 5} ${eyeY + 14}`} stroke={eyeColor} strokeWidth="1.6" fill="none" strokeLinecap="round" />;
      case 'sleepy':
        return <path d={`M${60 - 4} ${eyeY + 15} Q60 ${eyeY + 17} ${60 + 4} ${eyeY + 15}`} stroke={eyeColor} strokeWidth="1.4" fill="none" strokeLinecap="round" />;
      case 'wide':
        return <ellipse cx={60} cy={eyeY + 16} rx="4" ry="5" fill={eyeColor} opacity="0.7" />;
      case 'soft':
        return <path d={`M${60 - 4} ${eyeY + 15} Q60 ${eyeY + 19} ${60 + 4} ${eyeY + 15}`} stroke={eyeColor} strokeWidth="1.4" fill="none" strokeLinecap="round" />;
      case 'worried':
        return <path d={`M${60 - 5} ${eyeY + 17} Q60 ${eyeY + 13} ${60 + 5} ${eyeY + 17}`} stroke={eyeColor} strokeWidth="1.6" fill="none" strokeLinecap="round" />;
      case 'spark':
        return <path d={`M${60 - 5} ${eyeY + 14} Q60 ${eyeY + 22} ${60 + 5} ${eyeY + 14}`} stroke={eyeColor} strokeWidth="1.8" fill="none" strokeLinecap="round" />;
      case 'calm':
      default:
        return <path d={`M${60 - 4} ${eyeY + 15} L${60 + 4} ${eyeY + 15}`} stroke={eyeColor} strokeWidth="1.4" strokeLinecap="round" />;
    }
  })();

  const renderEye = (cx: number) => {
    switch (expression) {
      case 'sleepy':
        return (
          <g key={cx}>
            <path d={`M${cx - 4} ${eyeY} Q${cx} ${eyeY + 3} ${cx + 4} ${eyeY}`} stroke={eyeColor} strokeWidth="1.6" fill="none" strokeLinecap="round" />
          </g>
        );
      case 'wide':
        return (
          <g key={cx} className={reduced ? '' : 'animate-blink'} style={{ transformOrigin: `${cx}px ${eyeY}px` }}>
            <circle cx={cx + eyeOffset.x} cy={eyeY + eyeOffset.y} r="4.5" fill={eyeColor} />
            <circle cx={cx + eyeOffset.x - 1} cy={eyeY + eyeOffset.y - 1.5} r="1.4" fill="#FBF6EC" />
          </g>
        );
      case 'spark':
        return (
          <g key={cx}>
            <path
              d={`M${cx} ${eyeY - 4} L${cx + 1.5} ${eyeY - 1} L${cx + 4} ${eyeY} L${cx + 1.5} ${eyeY + 1} L${cx} ${eyeY + 4} L${cx - 1.5} ${eyeY + 1} L${cx - 4} ${eyeY} L${cx - 1.5} ${eyeY - 1} Z`}
              fill={eyeColor}
            />
          </g>
        );
      default:
        return (
          <g key={cx} className={reduced ? '' : 'animate-blink'} style={{ transformOrigin: `${cx}px ${eyeY}px` }}>
            <circle cx={cx + eyeOffset.x} cy={eyeY + eyeOffset.y} r="3" fill={eyeColor} />
            <circle cx={cx + eyeOffset.x - 0.8} cy={eyeY + eyeOffset.y - 1} r="1" fill="#FBF6EC" />
          </g>
        );
    }
  };

  return (
    <g>
      {renderEye(60 - eyeSpacing)}
      {renderEye(60 + eyeSpacing)}
      {cheeks}
      {mouth}
    </g>
  );
}

function AccessoryEl({
  type,
  palette,
  state,
  bodyY,
}: {
  type: Accessory;
  palette: Creature['palette'];
  state: 'discovered' | 'familiar' | 'crowned';
  bodyY: number;
}) {
  if (state === 'crowned') {
    return <Crown bodyY={bodyY} />;
  }

  switch (type) {
    case 'none':
      return null;
    case 'crown':
      return <Crown bodyY={bodyY} />;
    case 'scarf':
      return (
        <g>
          <path d="M40 76 Q60 82 80 76 Q78 84 60 86 Q42 84 40 76 Z" fill={palette.accent} opacity="0.9" />
          <path d="M78 78 Q84 84 82 90 Q80 86 76 84 Z" fill={palette.accent} opacity="0.9" />
        </g>
      );
    case 'flower':
      return (
        <g transform={`translate(80 ${bodyY - 18})`}>
          <circle cx="0" cy="0" r="3" fill={palette.accent} />
          <circle cx="-4" cy="-2" r="3" fill={palette.accent} opacity="0.85" />
          <circle cx="4" cy="-2" r="3" fill={palette.accent} opacity="0.85" />
          <circle cx="-2" cy="3" r="3" fill={palette.accent} opacity="0.85" />
          <circle cx="2" cy="3" r="3" fill={palette.accent} opacity="0.85" />
          <circle cx="0" cy="0" r="1.5" fill="#F6D98B" />
        </g>
      );
    case 'leaf':
      return (
        <path d={`M56 ${bodyY - 22} Q50 ${bodyY - 30} 58 ${bodyY - 32} Q60 ${bodyY - 26} 56 ${bodyY - 22} Z`} fill={palette.accent} />
      );
    case 'sparkle':
      return (
        <g transform={`translate(86 ${bodyY - 16})`}>
          <path d="M0 -4 L1 -1 L4 0 L1 1 L0 4 L-1 1 L-4 0 L-1 -1 Z" fill={palette.accent} opacity="0.8" />
        </g>
      );
    case 'mask':
      return (
        <g opacity="0.6">
          <ellipse cx="60" cy={bodyY - 2} rx="20" ry="8" fill="#3B2F2F" opacity="0.15" />
        </g>
      );
    case 'umbrella':
      return (
        <g transform={`translate(60 ${bodyY - 26})`}>
          <path d="M-16 0 Q0 -14 16 0 Z" fill={palette.accent} />
          <line x1="0" y1="0" x2="0" y2="10" stroke="#3B2F2F" strokeWidth="1" />
        </g>
      );
    case 'star':
      return (
        <g transform={`translate(86 ${bodyY - 16})`}>
          <path
            d="M0 -5 L1.5 -1.5 L5 -1.5 L2 1 L3 4.5 L0 2.5 L-3 4.5 L-2 1 L-5 -1.5 L-1.5 -1.5 Z"
            fill={palette.accent}
          />
        </g>
      );
  }
}

function Crown({ bodyY }: { bodyY: number }) {
  const topY = bodyY - 30;
  return (
    <g transform={`translate(60 ${topY})`}>
      <path d="M-12 4 L-8 -6 L-4 2 L0 -8 L4 2 L8 -6 L12 4 Z" fill="#F6D98B" stroke="#E8C66B" strokeWidth="1" />
      <circle cx="0" cy="-8" r="1.5" fill="#F7B79A" />
      <circle cx="-8" cy="-6" r="1.2" fill="#F7B79A" />
      <circle cx="8" cy="-6" r="1.2" fill="#F7B79A" />
    </g>
  );
}

export function CreatureSilhouette({ size = 120, className = '' }: { size?: number; className?: string }) {
  return (
    <div className={`inline-block ${className}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 120 120" width={size} height={size} role="img" aria-label="Undiscovered creature">
        <path
          d="M30 70 Q22 50 38 40 Q50 28 60 30 Q70 28 82 40 Q98 50 90 70 Q88 88 60 88 Q32 88 30 70 Z"
          fill="currentColor"
          opacity="0.18"
        />
        <text x="60" y="72" textAnchor="middle" fontSize="28" fontWeight="700" fill="currentColor" opacity="0.4" fontFamily="Fredoka">
          ?
        </text>
      </svg>
    </div>
  );
}
