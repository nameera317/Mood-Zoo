import type { ClassifyResult, SuggestedActionType } from '@/types';
import { localClassify, detectCrisis, validateClassifyResult } from './classifier';

const TIMEOUT_MS = 5000;

export async function classifyWithFallback(
  text: string,
  valence: number,
  arousal: number,
  useOfflineOnly: boolean,
): Promise<{ result: ClassifyResult; source: 'llm' | 'offline' }> {
  if (detectCrisis(text)) {
    return {
      result: {
        speciesId: 'mossling',
        secondarySpeciesId: null,
        confidence: 1,
        reasoning: '',
        suggestedActionType: 'breathing',
        safetyFlag: true,
      },
      source: 'offline',
    };
  }

  if (!useOfflineOnly) {
    try {
      const result = await callApi(text, valence, arousal);
      if (result) return { result, source: 'llm' };
    } catch {
      // fall through to local
    }
  }

  return { result: localClassify(text, valence, arousal), source: 'offline' };
}

async function callApi(text: string, valence: number, arousal: number): Promise<ClassifyResult | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch('/api/classify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, valence, arousal }),
      signal: controller.signal,
    });

    if (!res.ok) return null;
    const data = await res.json();
    return validateClassifyResult(data);
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export function mapActionType(type: SuggestedActionType): SuggestedActionType {
  return type;
}
