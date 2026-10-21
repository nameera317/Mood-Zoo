import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wind, ListChecks, PenLine, Moon, Footprints, Heart, Play, Pause, Plus, Check } from 'lucide-react';
import { useToast } from '@/components/Toast';

export function BreathingTool() {
  const [active, setActive] = useState(false);
  const [phase, setPhase] = useState<'in' | 'hold' | 'out' | 'rest'>('in');
  const [count, setCount] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const phases: { key: typeof phase; duration: number; label: string }[] = [
    { key: 'in', duration: 4000, label: 'Breathe in... 4' },
    { key: 'hold', duration: 4000, label: 'Hold... 4' },
    { key: 'out', duration: 6000, label: 'Breathe out... 6' },
    { key: 'rest', duration: 2000, label: 'Rest' },
  ];

  useEffect(() => {
    if (!active) return;
    const current = phases[count % 4];
    setPhase(current.key);
    timerRef.current = setTimeout(() => {
      setCount((c) => c + 1);
    }, current.duration);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, count]);

  const scale = phase === 'in' ? 1.3 : phase === 'hold' ? 1.3 : phase === 'out' ? 0.8 : 0.8;
  const currentPhase = phases[count % 4];

  return (
    <div className="flex flex-col items-center">
      <button
        onClick={() => setActive(!active)}
        className="btn btn-ghost border border-[rgba(59,47,47,0.12)] mb-4"
      >
        {active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        {active ? 'Pause' : 'Start 4-4-6 breathing'}
      </button>

      <div className="relative h-40 flex items-center justify-center">
        <motion.div
          animate={active ? { scale } : { scale: 1 }}
          transition={{ duration: active ? currentPhase.duration / 1000 : 0.5, ease: 'easeInOut' }}
          className="w-28 h-28 rounded-full"
          style={{
            background: 'radial-gradient(circle, #9DBF9E 0%, #7BA37C 100%)',
            boxShadow: '0 8px 30px -8px rgba(157,191,158,0.5)',
          }}
        />
        <div className="absolute text-ink-soft font-head text-sm font-semibold">
          {active ? currentPhase.label : <Wind className="w-6 h-6 opacity-40" />}
        </div>
      </div>
    </div>
  );
}

export function TaskSplitTool() {
  const [task, setTask] = useState('');
  const [steps, setSteps] = useState<string[]>([]);
  const addToast = useToast((s) => s.addToast);

  const offlineSplit = (t: string): string[] => {
    const base = t.trim();
    return [
      `Write down what "${base}" actually means — one sentence.`,
      `Find the very first small physical action (open a file, send one message).`,
      `Do only that first step. Set a 10-minute timer.`,
    ];
  };

  const handleSplit = async () => {
    if (!task.trim()) return;
    try {
      const res = await fetch('/api/task-split', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task }),
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.steps) && data.steps.length === 3) {
          setSteps(data.steps);
          return;
        }
      }
    } catch {
      // offline fallback
    }
    setSteps(offlineSplit(task));
    addToast('Used offline task-split.', 'info');
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex gap-2 w-full max-w-sm">
        <input
          value={task}
          onChange={(e) => setTask(e.target.value)}
          placeholder="One thing that feels big..."
          className="flex-1 bg-cream-deep px-3 py-2 rounded-lg text-sm text-ink outline-none border border-[rgba(59,47,47,0.08)]"
          aria-label="Task to split"
        />
        <button onClick={handleSplit} className="btn btn-primary px-3 py-2 text-sm">
          <ListChecks className="w-4 h-4" /> Split
        </button>
      </div>
      {steps.length > 0 && (
        <ol className="w-full max-w-sm space-y-2">
          {steps.map((s, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-ink-soft font-body">
              <span className="font-head font-bold text-sage-deep">{i + 1}.</span>
              {s}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export function NameItTool() {
  const [answer, setAnswer] = useState('');
  return (
    <div className="flex flex-col items-center gap-3 max-w-sm mx-auto">
      <p className="text-sm text-ink-soft font-body italic text-center">
        What is this feeling asking for?
      </p>
      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="It might be asking for rest, or courage, or a boundary..."
        rows={2}
        className="w-full bg-cream-deep px-3 py-2 rounded-lg text-sm text-ink outline-none border border-[rgba(59,47,47,0.08)] resize-none"
        aria-label="What is this feeling asking for"
      />
      {answer.trim() && (
        <p className="text-xs text-ink-soft/60 font-hand text-lg text-center">
          That is worth remembering.
        </p>
      )}
    </div>
  );
}

export function WindDownTool() {
  const items = [
    'Put screens in another room',
    'Dim the lights for 10 minutes',
    'Write tomorrow\'s one priority',
    'Three slow breaths before bed',
  ];
  const [checked, setChecked] = useState<number[]>([]);

  return (
    <div className="max-w-sm mx-auto">
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li
            key={i}
            onClick={() => setChecked((c) => c.includes(i) ? c.filter((x) => x !== i) : [...c, i])}
            className="flex items-center gap-3 cursor-pointer text-sm text-ink-soft font-body"
          >
            <span className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${checked.includes(i) ? 'bg-sage border-sage' : 'border-[rgba(59,47,47,0.2)]'}`}>
              {checked.includes(i) && <Check className="w-3 h-3 text-cream" />}
            </span>
            <span className={checked.includes(i) ? 'line-through opacity-50' : ''}>{item}</span>
          </li>
        ))}
      </ul>
      {checked.length === items.length && (
        <p className="text-center mt-3 text-xs text-sage-deep font-hand text-lg">
          Sleep well, you earned it.
        </p>
      )}
    </div>
  );
}

export function WalkTool() {
  return (
    <div className="flex flex-col items-center text-center max-w-sm mx-auto">
      <Footprints className="w-8 h-8 text-sage-deep mb-2" />
      <p className="text-sm text-ink-soft font-body">
        A two-minute walk. Just to the end of the room and back. Notice three things you can see.
      </p>
    </div>
  );
}

export function ReachOutTool() {
  const [sent, setSent] = useState(false);
  return (
    <div className="flex flex-col items-center text-center max-w-sm mx-auto">
      <Heart className="w-8 h-8 text-rose mb-2" />
      <p className="text-sm text-ink-soft font-body mb-3">
        Text one person something honest. "I had a hard day" is enough.
      </p>
      <button
        onClick={() => setSent(true)}
        className="btn btn-ghost border border-[rgba(59,47,47,0.12)] text-sm"
      >
        <PenLine className="w-4 h-4" /> I did it
      </button>
      <AnimatePresence>
        {sent && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-sage-deep font-hand text-lg mt-2"
          >
            That took courage. Good for you.
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

// keep imports used
void Plus;
