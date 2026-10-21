import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Home, BookOpen, Notebook, BarChart3, Settings as SettingsIcon } from 'lucide-react';
import { useStore } from '@/store';
import { Background } from '@/components/Background';
import { ToastContainer } from '@/components/Toast';
import { Onboarding } from '@/components/Onboarding';
import { HomeScreen } from '@/screens/HomeScreen';
import { DiscoveryScreen } from '@/screens/DiscoveryScreen';
import { SafetyScreen } from '@/screens/SafetyScreen';
import { FieldGuideScreen } from '@/screens/FieldGuideScreen';
import { JournalScreen } from '@/screens/JournalScreen';
import { InsightsScreen } from '@/screens/InsightsScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';
import { ShareCard } from '@/components/ShareCard';
import { classifyWithFallback } from '@/lib/api';
import type { ClassifyResult } from '@/types';

type Tab = 'home' | 'guide' | 'journal' | 'insights' | 'settings';
type HomeState =
  | { mode: 'input' }
  | { mode: 'searching'; text: string; valence: number; arousal: number }
  | { mode: 'reveal'; text: string; valence: number; arousal: number; result: ClassifyResult; source: 'llm' | 'offline' }
  | { mode: 'safety' };

const NAV: { id: Tab; icon: typeof Home; label: string }[] = [
  { id: 'home', icon: Home, label: 'Today' },
  { id: 'guide', icon: BookOpen, label: 'Guide' },
  { id: 'journal', icon: Notebook, label: 'Journal' },
  { id: 'insights', icon: BarChart3, label: 'Notes' },
  { id: 'settings', icon: SettingsIcon, label: 'Settings' },
];

export default function App() {
  const onboarded = useStore((s) => s.onboarded);
  const theme = useStore((s) => s.theme);
  const offlineOnly = useStore((s) => s.offlineOnly);
  const loadDemoData = useStore((s) => s.loadDemoData);
  const touchLastVisit = useStore((s) => s.touchLastVisit);

  const [tab, setTab] = useState<Tab>('home');
  const [homeState, setHomeState] = useState<HomeState>({ mode: 'input' });
  const [shareCard, setShareCard] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('night', theme === 'night');
  }, [theme]);

  useEffect(() => {
    touchLastVisit();
  }, [touchLastVisit]);

  const handleSubmit = useCallback(
    async (text: string, valence: number, arousal: number) => {
      setHomeState({ mode: 'searching', text, valence, arousal });
      const { result, source } = await classifyWithFallback(text, valence, arousal, offlineOnly);
      if (result.safetyFlag) {
        setHomeState({ mode: 'safety' });
      } else {
        setHomeState({ mode: 'reveal', text, valence, arousal, result, source });
      }
    },
    [offlineOnly],
  );

  const handleReset = useCallback(() => {
    setHomeState({ mode: 'input' });
  }, []);

  const handleLoadDemo = useCallback(() => {
    loadDemoData();
    setTab('guide');
  }, [loadDemoData]);

  if (!onboarded) {
    return (
      <>
        <Onboarding />
        <ToastContainer />
      </>
    );
  }

  return (
    <div className="min-h-screen relative">
      <Background />
      <ToastContainer />

      <main className="relative z-10 pb-24 sm:pb-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {tab === 'home' && (
              <>
                {homeState.mode === 'input' && (
                  <HomeScreen onSubmit={handleSubmit} isSearching={false} />
                )}
                {homeState.mode === 'searching' && (
                  <SearchingState />
                )}
                {homeState.mode === 'reveal' && (
                  <DiscoveryScreen
                    text={homeState.text}
                    valence={homeState.valence}
                    arousal={homeState.arousal}
                    result={homeState.result}
                    source={homeState.source}
                    onReset={handleReset}
                    onRetry={() => handleReset()}
                  />
                )}
                {homeState.mode === 'safety' && (
                  <SafetyScreen onContinue={handleReset} />
                )}
              </>
            )}
            {tab === 'guide' && <FieldGuideScreen onShare={(id: string) => setShareCard(id)} />}
            {tab === 'journal' && <JournalScreen />}
            {tab === 'insights' && <InsightsScreen />}
            {tab === 'settings' && <SettingsScreen onLoadDemo={handleLoadDemo} />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer disclaimer */}
      <footer className="relative z-10 pb-20 sm:pb-4 px-4 text-center">
        <p className="text-[11px] text-ink-soft/50 font-body">
          Moodex is a playful self-reflection tool. It is not a medical or therapy service.
        </p>
      </footer>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 paper-card mx-auto mb-3 w-[calc(100%-1.5rem)] max-w-md p-1.5 flex justify-around">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors ${active ? 'text-sage-deep' : 'text-ink-soft/50'}`}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-head font-semibold">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <AnimatePresence>
        {shareCard && <ShareCard speciesId={shareCard} onClose={() => setShareCard(null)} />}
      </AnimatePresence>
    </div>
  );
}

function SearchingState() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-20 flex flex-col items-center text-center">
      <motion.div
        animate={{ rotate: [0, -12, 12, -8, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="text-6xl mb-4"
        aria-hidden
      >
        🔍
      </motion.div>
      <p className="font-hand text-2xl text-ink-soft animate-pulse">
        Searching the meadow...
      </p>
      <div className="mt-6 flex gap-2">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-2 h-2 rounded-full bg-sage"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
    </div>
  );
}
