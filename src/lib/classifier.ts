import { z } from 'zod';
import type { ClassifyResult, SuggestedActionType } from '@/types';
import { CREATURES, CREATURE_MAP } from '@/data/creatures';

export const ClassifyResultSchema = z.object({
  speciesId: z.string().min(1),
  secondarySpeciesId: z.string().nullable(),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
  suggestedActionType: z.enum([
    'breathing',
    'task-split',
    'name-it',
    'walk',
    'wind-down',
    'reach-out',
  ]),
  safetyFlag: z.boolean(),
});

export function validateClassifyResult(data: unknown): ClassifyResult | null {
  const parsed = ClassifyResultSchema.safeParse(data);
  if (!parsed.success) return null;
  if (!CREATURE_MAP[parsed.data.speciesId]) return null;
  if (parsed.data.secondarySpeciesId && !CREATURE_MAP[parsed.data.secondarySpeciesId]) return null;
  return parsed.data;
}

const CRISIS_PATTERNS = [
  'kill myself', 'killing myself', 'want to die', 'wanna die', 'end my life', 'ending my life',
  "can't go on", 'cant go on', 'no reason to live', 'better off dead', 'better off without me',
  'suicide', 'suicidal', 'self harm', 'self-harm', 'cutting myself', 'hurt myself',
  'harming myself', "don't want to be here", 'dont want to be here', 'not want to be here',
  'take my own life', 'overdose', 'jump off', 'end it all', 'give up on life',
  'nobody would miss me', 'no one would miss me', 'everyone would be better off',
];

export function detectCrisis(text: string): boolean {
  const lower = text.toLowerCase();
  return CRISIS_PATTERNS.some((p) => lower.includes(p));
}

type GroupScores = Record<string, { score: number; creatureIds: string[] }>;

const KEYWORDS: Record<string, string[]> = {
  calm: ['calm', 'peaceful', 'peace', 'quiet', 'relaxed', 'content', 'settled', 'steady', 'serene', 'still', 'easy', 'cozy', 'comfortable', 'restful', 'at ease'],
  energized: ['excited', 'hopeful', 'proud', 'curious', 'energized', 'motivated', 'inspired', 'eager', 'looking forward', 'thrilled', 'buzzing', 'alive', 'giddy', 'bright', 'optimistic', 'anticipate good'],
  anxious: ['anxious', 'worried', 'nervous', 'dread', 'on edge', 'on-edge', 'tense', 'panic', 'overwhelm', 'overwhelmed', 'overstimulated', 'too much', 'racing thoughts', 'spiraling', 'can\'t stop thinking', 'overthinking', 'stressed', 'stressed out', 'unsettled', 'jittery', 'restless'],
  low: ['sad', 'down', 'low', 'heavy', 'lonely', 'alone', 'empty', 'hollow', 'numb', 'tired', 'exhausted', 'drained', 'homesick', 'discouraged', 'defeated', 'hopeless', 'blue', 'gloomy', 'weary', 'spent', 'burnt out', 'burned out', 'burnout', 'tired but wired', 'wired', 'depressed', 'flat'],
  irritated: ['frustrated', 'frustrate', 'annoyed', 'annoying', 'irritated', 'angry', 'mad', 'resentful', 'resentment', 'impatient', 'fed up', 'sick of', 'tired of', 'pissed', 'irritated', 'grumpy', 'snappy', 'bitter'],
  social: ['embarrassed', 'embarrassing', 'jealous', 'envious', 'left out', 'left-out', 'excluded', 'lonely', 'awkward', 'belonging', 'connected', 'left behind', 'unseen', 'invisible', 'cringe', 'ashamed', 'guilty'],
  mixed: ['bittersweet', 'nostalgic', 'nostalgia', 'relieved but', 'relieved', 'conflicted', 'torn', 'mixed', 'complex', 'tender', 'competing', 'two minds', 'wistful', 'melancholy', 'sentimental'],
};

const PHRASE_BONUS: { phrase: string; group: string; weight: number }[] = [
  { phrase: 'looking forward', group: 'energized', weight: 3 },
  { phrase: 'cant sleep', group: 'anxious', weight: 2 },
  { phrase: "can't sleep", group: 'anxious', weight: 2 },
  { phrase: 'too much', group: 'anxious', weight: 2 },
  { phrase: 'left out', group: 'social', weight: 3 },
  { phrase: 'fed up', group: 'irritated', weight: 3 },
  { phrase: 'sick of', group: 'irritated', weight: 2 },
  { phrase: 'burnt out', group: 'low', weight: 3 },
  { phrase: 'burned out', group: 'low', weight: 3 },
  { phrase: 'tired but wired', group: 'low', weight: 3 },
  { phrase: 'cant go on', group: 'anxious', weight: 1 },
  { phrase: "can't go on", group: 'anxious', weight: 1 },
  { phrase: 'good day', group: 'calm', weight: 2 },
  { phrase: 'great day', group: 'energized', weight: 2 },
  { phrase: 'hard day', group: 'low', weight: 2 },
  { phrase: 'long day', group: 'low', weight: 1 },
  { phrase: 'rough day', group: 'low', weight: 2 },
  { phrase: 'bad day', group: 'low', weight: 2 },
  { phrase: 'quiet day', group: 'calm', weight: 2 },
  { phrase: 'nice day', group: 'calm', weight: 2 },
  { phrase: 'big win', group: 'energized', weight: 3 },
  { phrase: 'did it', group: 'energized', weight: 2 },
  { phrase: 'finally', group: 'energized', weight: 1 },
  { phrase: 'thank', group: 'calm', weight: 2 },
  { phrase: 'grateful', group: 'calm', weight: 3 },
  { phrase: 'miss', group: 'low', weight: 1 },
  { phrase: 'miss home', group: 'low', weight: 3 },
  { phrase: 'homesick', group: 'low', weight: 3 },
  { phrase: 'remember when', group: 'mixed', weight: 2 },
  { phrase: 'used to', group: 'mixed', weight: 1 },
  { phrase: 'reminisce', group: 'mixed', weight: 3 },
  { phrase: 'old photo', group: 'mixed', weight: 2 },
  { phrase: 'old song', group: 'mixed', weight: 2 },
  { phrase: 'goodbye', group: 'mixed', weight: 2 },
  { phrase: 'last day', group: 'mixed', weight: 2 },
];

const NEGATION_PREFIXES = ['not ', 'no ', 'never ', 'don\'t feel ', 'dont feel ', "isn't ", 'isnt '];

function scoreText(text: string): GroupScores {
  const lower = ' ' + text.toLowerCase() + ' ';
  const groups: GroupScores = {};

  for (const [group, keywords] of Object.entries(KEYWORDS)) {
    let score = 0;
    for (const kw of keywords) {
      let idx = lower.indexOf(kw);
      while (idx !== -1) {
        const before = lower.slice(Math.max(0, idx - 6), idx);
        const negated = NEGATION_PREFIXES.some((n) => before.endsWith(n));
        score += negated ? -1 : 2;
        idx = lower.indexOf(kw, idx + kw.length);
      }
    }
    if (score > 0) {
      groups[group] = { score, creatureIds: [] };
    }
  }

  for (const { phrase, group, weight } of PHRASE_BONUS) {
    if (lower.includes(phrase)) {
      const before = lower.slice(Math.max(0, lower.indexOf(phrase) - 6), lower.indexOf(phrase));
      const negated = NEGATION_PREFIXES.some((n) => before.endsWith(n));
      if (!negated) {
        groups[group] = groups[group] || { score: 0, creatureIds: [] };
        groups[group].score += weight;
      }
    }
  }

  return groups;
}

function applyValenceArousal(groups: GroupScores, valence: number, arousal: number) {
  const valenceGroupBias: Record<string, number> = {
    calm: valence > 0.3 && arousal < 0 ? 1.5 : 0,
    energized: valence > 0.3 && arousal > 0.2 ? 1.5 : 0,
    anxious: valence < -0.1 && arousal > 0.3 ? 1.8 : 0,
    low: valence < -0.3 ? 1.8 : 0,
    irritated: valence < -0.2 && arousal > 0.2 ? 1.2 : 0,
    social: valence < -0.1 ? 0.8 : 0,
    mixed: Math.abs(valence) < 0.25 ? 1.0 : 0,
  };

  for (const [group, bias] of Object.entries(valenceGroupBias)) {
    if (bias > 0) {
      groups[group] = groups[group] || { score: 0, creatureIds: [] };
      groups[group].score += bias;
    }
  }
}

function pickCreatureForGroup(
  group: string,
  text: string,
  groups: GroupScores,
): string | null {
  const lower = text.toLowerCase();
  const candidates = CREATURES.filter((c) => c.emotionGroup === group || c.secondaryGroup === group);

  if (candidates.length === 0) return null;

  const scored = candidates.map((c) => {
    let s = 0;
    const habitatWords = c.habitat.toLowerCase().split(/[,/]+/).map((w) => w.trim());
    for (const hw of habitatWords) {
      const words = hw.split(/\s+/).filter((w) => w.length > 3 && !['that', 'this', 'with', 'from', 'after'].includes(w));
      for (const w of words) {
        if (lower.includes(w)) s += 2;
      }
    }
    const emotionWords = c.emotion.toLowerCase().split(/[\s/]+/);
    for (const ew of emotionWords) {
      if (ew.length > 2 && lower.includes(ew)) s += 3;
    }
    if (c.secondaryGroup && groups[c.secondaryGroup]) s += 0.5;
    const rarityBias: Record<string, number> = { common: 1.2, uncommon: 1, rare: 0.7, legendary: 0.5 };
    s += rarityBias[c.rarity] ?? 1;
    return { id: c.id, score: s };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.id ?? null;
}

export function localClassify(text: string, valence = 0, arousal = 0): ClassifyResult {
  const groups = scoreText(text);
  applyValenceArousal(groups, valence, arousal);

  const sorted = Object.entries(groups).sort((a, b) => b[1].score - a[1].score);

  let primaryGroup = sorted[0]?.[0];
  let secondaryGroup = sorted[1]?.[0];

  if (!primaryGroup) {
    if (valence > 0.4) primaryGroup = 'calm';
    else if (valence < -0.4) primaryGroup = 'low';
    else if (arousal > 0.5) primaryGroup = 'anxious';
    else if (arousal < -0.3) primaryGroup = 'low';
    else primaryGroup = 'mixed';
  }

  const primaryId = pickCreatureForGroup(primaryGroup, text, groups);
  if (!primaryId) {
    return {
      speciesId: 'mossling',
      secondarySpeciesId: null,
      confidence: 0.3,
      reasoning: 'A gentle day that is hard to pin down. Mossling will keep you company.',
      suggestedActionType: 'name-it',
      safetyFlag: false,
    };
  }

  const secondaryId = secondaryGroup ? pickCreatureForGroup(secondaryGroup, text, groups) : null;

  const primaryScore = groups[primaryGroup]?.score ?? 1;
  const topScore = sorted[0]?.[1].score ?? 1;
  const confidence = Math.min(0.92, Math.max(0.4, primaryScore / Math.max(topScore + 2, 4)));

  const creature = CREATURE_MAP[primaryId];
  const reasoning = buildReasoning(creature.emotion, text, primaryGroup);

  return {
    speciesId: primaryId,
    secondarySpeciesId: secondaryId && secondaryId !== primaryId ? secondaryId : null,
    confidence,
    reasoning,
    suggestedActionType: creature.actionType,
    safetyFlag: false,
  };
}

function buildReasoning(emotion: string, _text: string, group: string): string {
  const templates = [
    `Your sentence had the texture of ${emotion.toLowerCase()} — a ${group} kind of day.`,
    `This reads like ${emotion.toLowerCase()}. The words point to the ${group} meadow.`,
    `A ${group} feeling — somewhere around ${emotion.toLowerCase()} — seemed to fit best.`,
    `Your day sounds like ${emotion.toLowerCase()} lives in it. We looked in the ${group} meadow.`,
    `The shape of your sentence matches ${emotion.toLowerCase()}, a ${group} creature.`,
  ];
  return templates[Math.floor(Math.random() * templates.length)];
}

export function getAlternativeCreatures(
  primaryId: string,
  text: string,
  valence: number,
  arousal: number,
): string[] {
  const groups = scoreText(text);
  applyValenceArousal(groups, valence, arousal);
  const sorted = Object.entries(groups).sort((a, b) => b[1].score - a[1].score);
  const alts: string[] = [];
  for (const [group] of sorted) {
    const id = pickCreatureForGroup(group, text, groups);
    if (id && id !== primaryId && !alts.includes(id)) alts.push(id);
    if (alts.length >= 2) break;
  }
  while (alts.length < 2) {
    const random = CREATURES[Math.floor(Math.random() * CREATURES.length)];
    if (random.id !== primaryId && !alts.includes(random.id)) alts.push(random.id);
  }
  return alts.slice(0, 2);
}
