import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Shield, Compass } from 'lucide-react';
import { useStore } from '@/store';

const CARDS = [
  {
    icon: Sparkles,
    title: 'A field guide to your feelings',
    body: 'Write one sentence about your day. Moodex finds a tiny creature for the feeling and adds it to your collection — growing your emotional vocabulary, one feeling at a time.',
  },
  {
    icon: Compass,
    title: 'Discover 40 creatures',
    body: 'Each creature maps to a nuanced emotion, from quiet contentment to restless dread. Over time you build a meadow of feelings you can name.',
  },
  {
    icon: Shield,
    title: 'Your data stays on your device',
    body: 'Everything lives in your browser. Nothing is uploaded unless you turn on the AI classifier, and even then only your single sentence is sent — never stored.',
  },
];

export function Onboarding() {
  const setOnboarded = useStore((s) => s.setOnboarded);
  const [step, setStep] = useState(0);

  const isLast = step === CARDS.length - 1;
  const card = CARDS[step];
  const Icon = card.icon;

  return (
    <div className="fixed inset-0 z-50 bg-cream flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
            className="paper-card p-8 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-sage/20 flex items-center justify-center mx-auto mb-5">
              <Icon className="w-8 h-8 text-sage-deep" />
            </div>
            <h2 className="font-head text-2xl font-bold text-ink mb-3">{card.title}</h2>
            <p className="text-sm text-ink-soft font-body leading-relaxed">{card.body}</p>
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-between mt-6">
          <button onClick={() => setOnboarded(true)} className="text-sm text-ink-soft/50 hover:text-ink-soft font-body">
            Skip
          </button>
          <div className="flex gap-1.5">
            {CARDS.map((_, i) => (
              <span key={i} className={`w-2 h-2 rounded-full transition-colors ${i === step ? 'bg-sage-deep' : 'bg-[rgba(59,47,47,0.15)]'}`} />
            ))}
          </div>
          <button
            onClick={() => (isLast ? setOnboarded(true) : setStep(step + 1))}
            className="btn btn-primary text-sm"
          >
            {isLast ? 'Start exploring' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
