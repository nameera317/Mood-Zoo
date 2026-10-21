import { describe, it, expect } from 'vitest';
import { computeStats } from './insights-stats';
import type { JournalEntry } from '@/types';

function makeEntry(daysAgo: number, speciesId: string, hour = 12): JournalEntry {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, 0, 0, 0);
  return {
    id: `test-${daysAgo}-${speciesId}`,
    text: 'test',
    speciesId,
    secondarySpeciesId: null,
    reasoning: '',
    confidence: 0.8,
    actionType: 'breathing',
    valence: 0,
    arousal: 0,
    createdAt: d.getTime(),
    wasCorrection: false,
    source: 'offline',
  };
}

describe('computeStats', () => {
  it('counts total discovered species', () => {
    const entries = [makeEntry(1, 'mossling'), makeEntry(2, 'fizzlet')];
    const stats = computeStats(entries);
    expect(stats.totalDiscovered).toBe(2);
  });

  it('finds the most common creature', () => {
    const entries = [makeEntry(1, 'mossling'), makeEntry(2, 'mossling'), makeEntry(3, 'fizzlet')];
    const stats = computeStats(entries);
    expect(stats.mostCommon?.id).toBe('mossling');
    expect(stats.mostCommon?.count).toBe(2);
  });

  it('counts unique species within the last month', () => {
    const entries = [makeEntry(1, 'mossling'), makeEntry(2, 'fizzlet'), makeEntry(40, 'ember-pup')];
    const stats = computeStats(entries);
    expect(stats.uniqueThisMonth).toBe(2);
  });
});
