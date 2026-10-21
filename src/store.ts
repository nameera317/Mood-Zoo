import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval';
import type { JournalEntry, ClassifyResult } from '@/types';
import { CREATURES, CREATURE_MAP } from '@/data/creatures';
import { localClassify } from '@/lib/classifier';

export type Theme = 'day' | 'night';

interface MoodexState {
  entries: JournalEntry[];
  onboarded: boolean;
  theme: Theme;
  soundEnabled: boolean;
  reduceMotion: boolean;
  offlineOnly: boolean;
  lastVisit: string | null;

  addEntry: (entry: Omit<JournalEntry, 'id' | 'createdAt'>) => JournalEntry;
  updateEntry: (id: string, text: string) => void;
  deleteEntry: (id: string) => void;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  setSound: (v: boolean) => void;
  setReduceMotion: (v: boolean) => void;
  setOfflineOnly: (v: boolean) => void;
  setOnboarded: (v: boolean) => void;
  clearAll: () => void;
  importData: (data: { entries: JournalEntry[] }) => void;
  loadDemoData: () => void;
  touchLastVisit: () => void;
}

const idbStorage = {
  getItem: async (name: string) => {
    const val = await idbGet(name);
    return val ?? null;
  },
  setItem: async (name: string, value: string) => {
    await idbSet(name, value);
  },
  removeItem: async (name: string) => {
    await idbDel(name);
  },
};

const DEMO_SENTENCES = [
  { text: 'Had a really good meeting today and felt proud of the work I presented.', creature: 'bright-fin' },
  { text: 'Feeling grateful for my friend who called me out of the blue.', creature: 'honey-grub' },
  { text: 'Cant stop thinking about the presentation tomorrow, spiraling a bit.', creature: 'spiraling-jay' },
  { text: 'Quiet morning with coffee, nothing urgent. Felt peaceful.', creature: 'drift-bloom' },
  { text: 'Got passed over for the project again, feeling resentful about doing more than my share.', creature: 'bristle-boar' },
  { text: 'Saw an old photo from college and felt so nostalgic and a little sad.', creature: 'relic-fox' },
  { text: 'Too many things on my plate today, completely overwhelmed.', creature: 'shadow-pup' },
  { text: 'Excited about the trip next weekend, buzzing with anticipation.', creature: 'kindlewing' },
  { text: 'Felt left out when my friends made plans without me again.', creature: 'window-sparrow' },
  { text: 'Finally finished the big task. Relieved but completely drained.', creature: 'spent-sprite' },
  { text: 'Dreading the conversation I have to have with my manager on Monday.', creature: 'dread-moth' },
  { text: 'Someone made dinner for me. Felt warm and grateful and like I belong.', creature: 'warm-hearth' },
  { text: 'Been pushing too hard for months. Feeling burnt out and hollow.', creature: 'burnt-leaf' },
  { text: 'Got frustrated trying to fix the same bug for the third time.', creature: 'ember-pup' },
  { text: 'Said something embarrassing in the group chat. Want to disappear.', creature: 'blush-beetle' },
  { text: 'Homesick today. Miss the food from home and my old street.', creature: 'fog-fawn' },
  { text: 'Curious about a new topic and went down a rabbit hole. Fun.', creature: 'gleam-otter' },
  { text: 'Restless energy all evening, cant settle down to sleep.', creature: 'fizzlet' },
  { text: 'Watched a tender documentary and cried a little. In a soft mood.', creature: 'tender-spring' },
  { text: 'Steady day. Handled a hard thing and feel grounded.', creature: 'stonelet' },
  { text: 'Overstimulated after a loud crowded event. Need quiet.', creature: 'static-sprite' },
];

function generateDemoEntries(): JournalEntry[] {
  const entries: JournalEntry[] = [];
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  DEMO_SENTENCES.forEach((demo, i) => {
    const daysAgo = DEMO_SENTENCES.length - 1 - i;
    const date = now - daysAgo * day;
    const creature = CREATURE_MAP[demo.creature] || CREATURES[0];
    const result: ClassifyResult = localClassify(demo.text, 0, 0);
    const hour = [8, 9, 10, 12, 14, 16, 18, 19, 20, 21, 22, 23, 7, 11, 13, 15, 17, 20, 19, 9, 18][i % 21];
    const valence = creature.emotionGroup === 'calm' || creature.emotionGroup === 'energized' ? 0.5 :
      creature.emotionGroup === 'low' || creature.emotionGroup === 'anxious' ? -0.5 : 0;
    const arousal = creature.emotionGroup === 'anxious' || creature.emotionGroup === 'irritated' ? 0.6 :
      creature.emotionGroup === 'calm' ? -0.4 : 0.1;

    entries.push({
      id: `demo-${i}`,
      text: demo.text,
      speciesId: demo.creature,
      secondarySpeciesId: result.secondarySpeciesId,
      reasoning: result.reasoning,
      confidence: 0.75,
      actionType: creature.actionType,
      valence,
      arousal,
      createdAt: date,
      wasCorrection: false,
      source: 'offline',
    });
    void hour;
  });

  return entries;
}

export const useStore = create<MoodexState>()(
  persist(
    (set, get) => ({
      entries: [],
      onboarded: false,
      theme: 'day',
      soundEnabled: false,
      reduceMotion: false,
      offlineOnly: false,
      lastVisit: null,

      addEntry: (entry) => {
        const newEntry: JournalEntry = {
          ...entry,
          id: `e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          createdAt: Date.now(),
        };
        set((s) => ({ entries: [newEntry, ...s.entries] }));
        return newEntry;
      },

      updateEntry: (id, text) => {
        set((s) => ({
          entries: s.entries.map((e) => (e.id === id ? { ...e, text } : e)),
        }));
      },

      deleteEntry: (id) => {
        set((s) => ({ entries: s.entries.filter((e) => e.id !== id) }));
      },

      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((s) => ({ theme: s.theme === 'day' ? 'night' : 'day' })),
      setSound: (soundEnabled) => set({ soundEnabled }),
      setReduceMotion: (reduceMotion) => set({ reduceMotion }),
      setOfflineOnly: (offlineOnly) => set({ offlineOnly }),
      setOnboarded: (onboarded) => set({ onboarded }),

      clearAll: () => set({ entries: [] }),

      importData: (data) => set({ entries: data.entries }),

      loadDemoData: () => {
        if (get().entries.length > 0) return;
        set({ entries: generateDemoEntries() });
      },

      touchLastVisit: () => {
        const today = new Date().toDateString();
        set({ lastVisit: today });
      },
    }),
    {
      name: 'moodex-store',
      storage: createJSONStorage(() => idbStorage),
    },
  ),
);
