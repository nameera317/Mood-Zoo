import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Check, X, Save, Search as SearchIcon, RotateCcw } from 'lucide-react';
import { Creature } from '@/components/Creature';
import { CREATURE_MAP } from '@/data/creatures';
import { useStore } from '@/store';
import { useToast } from '@/components/Toast';
import { sounds } from '@/lib/sound';
import { getAlternativeCreatures } from '@/lib/classifier';
import type { ClassifyResult } from '@/types';
import { BreathingTool, TaskSplitTool, NameItTool, WindDownTool, WalkTool, ReachOutTool } from '@/components/ActionTools';

type Props = {
  text: string;
  valence: number;
  arousal: number;
  result: ClassifyResult;
  source: 'llm' | 'offline';
  onReset: () => void;
  onRetry: (newText: string, v: number, a: number) => void;
};

export function DiscoveryScreen({ text, valence, arousal, result, source, onReset, onRetry }: Props) {
  const creature = CREATURE_MAP[result.speciesId];
  const secondary = result.secondarySpeciesId ? CREATURE_MAP[result.secondarySpeciesId] : null;
  const entries = useStore((s) => s.entries);
  const addEntry = useStore((s) => s.addEntry);
  const soundEnabled = useStore((s) => s.soundEnabled);
  const reduceMotion = useStore((s) => s.reduceMotion);
  const addToast = useToast((s) => s.addToast);

  const [showAlternatives, setShowAlternatives] = useState(false);
  const [alternatives, setAlternatives] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [selectedAlt, setSelectedAlt] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const isNew = !entries.some((e) => e.speciesId === result.speciesId);
  const currentId = selectedAlt || result.speciesId;
  const currentCreature = CREATURE_MAP[currentId];
  const currentSecondary = selectedAlt ? null : secondary;

  useEffect(() => {
    if (isNew && !reduceMotion) {
      const duration = 2000;
      const end = Date.now() + duration;
      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#9DBF9E', '#F6D98B', '#F7B79A', '#C5B3E6', '#9CC5E8'],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#9DBF9E', '#F6D98B', '#F7B79A', '#C5B3E6', '#9CC5E8'],
        });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      if (soundEnabled) sounds.discover();
      frame();
    } else if (soundEnabled) {
      sounds.soft();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFeelsRight = () => {
    if (soundEnabled) sounds.click();
    addToast('Lovely. Saved to your journal.', 'success');
    saveEntry(currentId, false);
    setSaved(true);
  };

  const handleNotQuite = () => {
    if (soundEnabled) sounds.click();
    const alts = getAlternativeCreatures(result.speciesId, text, valence, arousal);
    setAlternatives(alts);
    setShowAlternatives(true);
  };

  const handlePickAlt = (id: string) => {
    if (soundEnabled) sounds.click();
    setSelectedAlt(id);
    setShowAlternatives(false);
    addToast('Got it. That helps me match better next time.', 'success');
    saveEntry(id, true);
    setSaved(true);
  };

  const saveEntry = (speciesId: string, wasCorrection: boolean) => {
    addEntry({
      text,
      speciesId,
      secondarySpeciesId: currentSecondary?.id ?? null,
      reasoning: result.reasoning,
      confidence: result.confidence,
      actionType: result.suggestedActionType,
      valence,
      arousal,
      wasCorrection,
      source,
    });
  };

  const handleSaveOnly = () => {
    if (soundEnabled) sounds.click();
    saveEntry(currentId, false);
    setSaved(true);
    addToast('Saved to your journal.', 'success');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:py-10">
      <div className="flex justify-center mb-4">
        {source === 'offline' && (
          <span className="chip bg-cream-deep text-ink-soft border border-[rgba(59,47,47,0.1)]">
            <SearchIcon className="w-3 h-3" /> Offline mode
          </span>
        )}
      </div>

      {/* Card flip reveal */}
      <motion.div
        ref={cardRef}
        initial={reduceMotion ? false : { rotateY: 90, opacity: 0 }}
        animate={{ rotateY: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        style={{ transformStyle: 'preserve-3d', perspective: 1000 }}
        className="paper-card p-6 sm:p-8 relative overflow-hidden"
      >
        <div className="washi" style={{ top: -6, right: 24, transform: 'rotate(7deg)', backgroundColor: '#9DBF9E' }} />
        <div className="washi" style={{ bottom: -6, left: 16, transform: 'rotate(-5deg)', backgroundColor: '#F6D98B' }} />

        <div className="flex flex-col items-center text-center">
          <div className="text-xs text-ink-soft/50 font-hand text-lg mb-1">a new discovery</div>

          <div className="relative">
            <Creature
              creature={currentCreature}
              size={180}
              showSparkles={isNew}
              state="discovered"
            />
          </div>

          <h2 className="font-head text-3xl font-bold text-ink mt-3">{currentCreature.name}</h2>

          <div className="flex items-center gap-2 mt-2">
            <span className="text-lg font-semibold text-ink-soft font-body">{currentCreature.emotion}</span>
            <span
              className="stamp"
              style={{ color: getRarityColor(currentCreature.rarity) }}
            >
              {currentCreature.rarity}
            </span>
          </div>

          {isNew && (
            <motion.div
              initial={reduceMotion ? false : { scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: 'spring' }}
              className="mt-3 chip bg-butter text-ink font-head"
            >
              New species!
            </motion.div>
          )}

          {result.reasoning && (
            <p className="mt-4 text-sm text-ink-soft font-body italic max-w-md">
              {result.reasoning}
            </p>
          )}

          {currentSecondary && (
            <p className="mt-2 text-xs text-ink-soft/60 font-body">
              Maybe also: <span className="font-semibold">{currentSecondary.emotion}</span>
            </p>
          )}

          <p className="mt-4 text-sm text-ink-soft font-body max-w-md leading-relaxed">
            {currentCreature.description}
          </p>
        </div>

        {/* Suggested action mini-tool */}
        <div className="mt-6 border-t border-[rgba(59,47,47,0.08)] pt-5">
          <div className="text-xs font-semibold text-ink-soft mb-3 font-head text-center">
            A small thing you might try
          </div>
          <ActionTool type={result.suggestedActionType} />
        </div>

        {/* Action buttons */}
        {!saved && !showAlternatives && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-6 flex flex-wrap gap-3 justify-center"
          >
            <button onClick={handleFeelsRight} className="btn btn-primary">
              <Check className="w-4 h-4" /> Feels right
            </button>
            <button onClick={handleNotQuite} className="btn btn-ghost border border-[rgba(59,47,47,0.12)]">
              <X className="w-4 h-4" /> Not quite
            </button>
            <button onClick={handleSaveOnly} className="btn btn-ghost border border-[rgba(59,47,47,0.12)]">
              <Save className="w-4 h-4" /> Save to journal
            </button>
          </motion.div>
        )}

        {/* Alternatives */}
        <AnimatePresence>
          {showAlternatives && (
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6"
            >
              <p className="text-center text-sm text-ink-soft mb-4 font-body">
                Here are two other possibilities. Tap the one that fits.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {alternatives.map((id) => {
                  const alt = CREATURE_MAP[id];
                  return (
                    <button
                      key={id}
                      onClick={() => handlePickAlt(id)}
                      className="paper-card p-4 flex flex-col items-center hover:scale-[1.03] transition-transform"
                    >
                      <Creature creature={alt} size={90} interactive={false} />
                      <span className="font-head font-semibold text-sm mt-2 text-ink">{alt.name}</span>
                      <span className="text-xs text-ink-soft">{alt.emotion}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {saved && (
          <div className="mt-6 flex justify-center">
            <button onClick={onReset} className="btn btn-ghost border border-[rgba(59,47,47,0.12)]">
              <RotateCcw className="w-4 h-4" /> Write another
            </button>
          </div>
        )}
      </motion.div>

      <div className="mt-6 text-center">
        <button onClick={onReset} className="text-sm text-ink-soft/60 hover:text-ink-soft underline font-body">
          Start over
        </button>
      </div>
    </div>
  );
}

function ActionTool({ type }: { type: ClassifyResult['suggestedActionType'] }) {
  switch (type) {
    case 'breathing': return <BreathingTool />;
    case 'task-split': return <TaskSplitTool />;
    case 'name-it': return <NameItTool />;
    case 'wind-down': return <WindDownTool />;
    case 'walk': return <WalkTool />;
    case 'reach-out': return <ReachOutTool />;
    default: return null;
  }
}

function getRarityColor(rarity: string): string {
  const map: Record<string, string> = {
    common: '#9DBF9E',
    uncommon: '#9CC5E8',
    rare: '#C5B3E6',
    legendary: '#E8C66B',
  };
  return map[rarity] ?? '#9DBF9E';
}

// silence unused import warning for onRetry in some paths
void (undefined as unknown);
