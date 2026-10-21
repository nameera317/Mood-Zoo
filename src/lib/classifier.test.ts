import { describe, it, expect } from 'vitest';
import { localClassify, detectCrisis, validateClassifyResult, getAlternativeCreatures } from '@/lib/classifier';
import { CREATURE_MAP, CREATURES } from '@/data/creatures';
import { ClassifyResultSchema } from '@/lib/classifier';

describe('localClassify', () => {
  it('returns a valid speciesId from the creature list', () => {
    const result = localClassify('I feel so anxious about the presentation tomorrow');
    expect(CREATURE_MAP[result.speciesId]).toBeDefined();
  });

  it('matches anxious content to an anxious-group creature', () => {
    const result = localClassify("I'm dreading the meeting tomorrow, so nervous");
    const creature = CREATURE_MAP[result.speciesId];
    expect(creature.emotionGroup).toBe('anxious');
  });

  it('matches calm content to a calm-group creature', () => {
    const result = localClassify('Had a peaceful quiet morning, feeling content and relaxed');
    const creature = CREATURE_MAP[result.speciesId];
    expect(creature.emotionGroup).toBe('calm');
  });

  it('uses valence/arousal when text is ambiguous', () => {
    const result = localClassify('it was a day', -0.8, 0.1);
    const creature = CREATURE_MAP[result.speciesId];
    expect(['low', 'anxious', 'mixed']).toContain(creature.emotionGroup);
  });

  it('returns a confidence between 0 and 1', () => {
    const result = localClassify('excited about the trip!');
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  it('returns a non-empty reasoning string', () => {
    const result = localClassify('feeling grateful for my friend today');
    expect(result.reasoning.length).toBeGreaterThan(5);
  });

  it('secondarySpeciesId is null or a valid creature', () => {
    const result = localClassify('overwhelmed and frustrated at the same time');
    if (result.secondarySpeciesId) {
      expect(CREATURE_MAP[result.secondarySpeciesId]).toBeDefined();
    }
  });
});

describe('detectCrisis', () => {
  it('detects explicit crisis language', () => {
    expect(detectCrisis('I want to end my life')).toBe(true);
  });

  it('detects suicidal ideation phrases', () => {
    expect(detectCrisis("I can't go on anymore")).toBe(true);
  });

  it('does not flag ordinary sad text', () => {
    expect(detectCrisis('I had a really sad day today')).toBe(false);
  });
});

describe('validateClassifyResult', () => {
  it('validates a well-formed result', () => {
    const valid = {
      speciesId: 'mossling',
      secondarySpeciesId: null,
      confidence: 0.8,
      reasoning: 'A calm day.',
      suggestedActionType: 'breathing',
      safetyFlag: false,
    };
    expect(validateClassifyResult(valid)).not.toBeNull();
  });

  it('rejects an unknown speciesId', () => {
    const invalid = {
      speciesId: 'nonexistent',
      secondarySpeciesId: null,
      confidence: 0.8,
      reasoning: 'test',
      suggestedActionType: 'breathing',
      safetyFlag: false,
    };
    expect(validateClassifyResult(invalid)).toBeNull();
  });

  it('rejects out-of-range confidence', () => {
    const result = ClassifyResultSchema.safeParse({
      speciesId: 'mossling',
      secondarySpeciesId: null,
      confidence: 1.5,
      reasoning: 'test',
      suggestedActionType: 'breathing',
      safetyFlag: false,
    });
    expect(result.success).toBe(false);
  });
});

describe('getAlternativeCreatures', () => {
  it('returns exactly 2 alternatives different from primary', () => {
    const alts = getAlternativeCreatures('mossling', 'feeling nervous and tense', -0.3, 0.5);
    expect(alts).toHaveLength(2);
    expect(alts).not.toContain('mossling');
    alts.forEach((id) => expect(CREATURE_MAP[id]).toBeDefined());
  });
});

describe('creature data integrity', () => {
  it('has exactly 40 creatures', () => {
    expect(CREATURES).toHaveLength(40);
  });

  it('every creature has a unique id', () => {
    const ids = CREATURES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
