export type Rarity = 'common' | 'uncommon' | 'rare' | 'legendary';
export type EmotionGroup =
  | 'calm'
  | 'energized'
  | 'anxious'
  | 'low'
  | 'irritated'
  | 'social'
  | 'mixed';

export type BodyShape = 'blob' | 'round' | 'egg' | 'oval' | 'tall' | 'fluffy' | 'cloud' | 'winged';
export type EarType = 'none' | 'round' | 'pointy' | 'long' | 'leaf' | 'fin' | 'horn';
export type TailType = 'none' | 'round' | 'long' | 'tuft' | 'curl' | 'flame' | 'wisp';
export type Expression = 'calm' | 'happy' | 'sleepy' | 'wide' | 'soft' | 'worried' | 'spark';
export type Accessory = 'none' | 'crown' | 'scarf' | 'flower' | 'leaf' | 'sparkle' | 'mask' | 'umbrella' | 'star';

export type SuggestedActionType =
  | 'breathing'
  | 'task-split'
  | 'name-it'
  | 'walk'
  | 'wind-down'
  | 'reach-out';

export interface BodyConfig {
  shape: BodyShape;
  color: string;
  belly?: string;
  ears: EarType;
  tail: TailType;
}

export interface FaceConfig {
  expression: Expression;
  eyeColor?: string;
  cheekColor?: string;
}

export interface CreaturePalette {
  primary: string;
  secondary: string;
  accent: string;
}

export interface Creature {
  id: string;
  name: string;
  emotion: string;
  emotionGroup: EmotionGroup;
  secondaryGroup?: EmotionGroup;
  description: string;
  rarity: Rarity;
  habitat: string;
  palette: CreaturePalette;
  body: BodyConfig;
  face: FaceConfig;
  accessory: Accessory;
  actionType: SuggestedActionType;
  fieldNote: string;
}

export const EMOTION_GROUPS: EmotionGroup[] = [
  'calm',
  'energized',
  'anxious',
  'low',
  'irritated',
  'social',
  'mixed',
];

export const GROUP_LABELS: Record<EmotionGroup, string> = {
  calm: 'Calm',
  energized: 'Energized',
  anxious: 'Anxious',
  low: 'Low',
  irritated: 'Irritated',
  social: 'Social',
  mixed: 'Mixed',
};

export const GROUP_COLORS: Record<EmotionGroup, string> = {
  calm: '#9DBF9E',
  energized: '#F6D98B',
  anxious: '#9CC5E8',
  low: '#C5B3E6',
  irritated: '#F7B79A',
  social: '#ECA9A9',
  mixed: '#B8A9D9',
};

export const RARITY_LABELS: Record<Rarity, string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  legendary: 'Legendary',
};

export const RARITY_COLORS: Record<Rarity, string> = {
  common: '#9DBF9E',
  uncommon: '#9CC5E8',
  rare: '#C5B3E6',
  legendary: '#F6D98B',
};

export type ClassifyResult = {
  speciesId: string;
  secondarySpeciesId: string | null;
  confidence: number;
  reasoning: string;
  suggestedActionType: SuggestedActionType;
  safetyFlag: boolean;
};

export type JournalEntry = {
  id: string;
  text: string;
  speciesId: string;
  secondarySpeciesId: string | null;
  reasoning: string;
  confidence: number;
  actionType: SuggestedActionType;
  valence: number;
  arousal: number;
  createdAt: number;
  wasCorrection: boolean;
  source: 'llm' | 'offline' | 'manual';
};

export type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: string;
};
