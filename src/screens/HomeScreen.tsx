import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Search, Send } from 'lucide-react';
import { GuideCharacter } from '@/components/GuideCharacter';
import { PROMPTS } from '@/data/creatures';
import { useStore } from '@/store';
import { sounds } from '@/lib/sound';

type Props = {
  onSubmit: (text: string, valence: number, arousal: number) => void;
  isSearching: boolean;
};

const GREETINGS = [
  "What's your day been like? One sentence is plenty.",
  'Tell me about today. Just a sentence.',
  'How are you, really? One line will do.',
  'A word, a sentence, a feeling — whatever fits.',
];

export function HomeScreen({ onSubmit, isSearching }: Props) {
  const [text, setText] = useState('');
  const [promptIdx, setPromptIdx] = useState(0);
  const [valence, setValence] = useState(0.5);
  const [arousal, setArousal] = useState(0.5);
  const [greetingIdx, setGreetingIdx] = useState(0);
  const soundEnabled = useStore((s) => s.soundEnabled);
  const reduceMotion = useStore((s) => s.reduceMotion);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setGreetingIdx(Math.floor(Math.random() * GREETINGS.length));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setPromptIdx((i) => (i + 1) % PROMPTS.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed || isSearching) return;
    if (soundEnabled) sounds.click();
    onSubmit(trimmed, valence * 2 - 1, arousal * 2 - 1);
  };

  const canSubmit = text.trim().length > 0 && !isSearching;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center text-center"
      >
        <GuideCharacter
          size={80}
          message={GREETINGS[greetingIdx]}
        />
      </motion.div>

      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="mt-20 sm:mt-24"
      >
        <div className="paper-card p-5 sm:p-6 relative">
          <div className="washi" style={{ top: -8, left: 20, transform: 'rotate(-8deg)', backgroundColor: '#F7B79A' }} />

          <label className="block text-sm font-semibold text-ink-soft mb-2 font-head">
            Today's field note
          </label>

          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 280))}
            placeholder=""
            rows={3}
            disabled={isSearching}
            className="w-full bg-transparent text-ink text-lg leading-relaxed resize-none outline-none placeholder:text-ink-soft/40 font-body"
            aria-label="Write one sentence about your day"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit();
            }}
          />

          <AnimatePresence mode="wait">
            {text.length === 0 && !isSearching && (
              <motion.div
                key={promptIdx}
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="text-ink-soft/50 text-sm italic font-hand text-lg -mt-1 pointer-events-none"
              >
                {PROMPTS[promptIdx]}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-ink-soft/60 font-body">{text.length}/280</span>
            {text.length === 0 && (
              <span className="text-xs text-ink-soft/40 hidden sm:block">⌘+Enter to send</span>
            )}
          </div>
        </div>

        {/* Sliders */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <SliderCard
            label="How pleasant?"
            leftLabel="heavy"
            rightLabel="bright"
            value={valence}
            onChange={setValence}
            color="#9DBF9E"
          />
          <SliderCard
            label="How much energy?"
            leftLabel="calm"
            rightLabel="buzzing"
            value={arousal}
            onChange={setArousal}
            color="#F7B79A"
          />
        </div>

        <div className="mt-5 flex justify-center">
          <motion.button
            whileHover={reduceMotion ? undefined : { scale: 1.04 }}
            whileTap={reduceMotion ? undefined : { scale: 0.96 }}
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`btn btn-primary px-7 py-3 text-base ${!canSubmit ? 'opacity-40 cursor-not-allowed' : ''}`}
            aria-label="Search the meadow for a feeling creature"
          >
            {isSearching ? (
              <>
                <Search className="w-5 h-5 animate-spin" />
                Searching the meadow...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Look for a creature
              </>
            )}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

function SliderCard({
  label,
  leftLabel,
  rightLabel,
  value,
  onChange,
  color,
}: {
  label: string;
  leftLabel: string;
  rightLabel: string;
  value: number;
  onChange: (v: number) => void;
  color: string;
}) {
  return (
    <div className="paper-card px-4 py-3">
      <div className="text-xs font-semibold text-ink-soft mb-2 font-head">{label}</div>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-[var(--sage-deep)] cursor-pointer"
        style={{ accentColor: color }}
        aria-label={label}
      />
      <div className="flex justify-between text-[10px] text-ink-soft/50 mt-1 font-body">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </div>
  );
}
