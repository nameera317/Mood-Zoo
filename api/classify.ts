import type { ClassifyResult, SuggestedActionType } from '../src/types';
import { CREATURE_MAP, CREATURES } from '../src/data/creatures';
import { localClassify, validateClassifyResult } from '../src/lib/classifier';

const SYSTEM_PROMPT = `You are Moodex, a gentle feeling-classifier for a cozy self-reflection app.
Given a single sentence about someone's day, identify the most fitting creature species
from the provided list. Return ONLY valid JSON matching this schema:
{
  "speciesId": string (must be one of the provided species ids),
  "secondarySpeciesId": string | null (a second plausible species id, or null),
  "confidence": number (0 to 1),
  "reasoning": string (one short sentence, paraphrased — never quote the user),
  "suggestedActionType": "breathing" | "task-split" | "name-it" | "walk" | "wind-down" | "reach-out",
  "safetyFlag": boolean (true only if the text mentions self-harm, suicide, or crisis)
}

Species list:
${CREATURES.map((c) => `- ${c.id}: ${c.emotion} (${c.emotionGroup}, ${c.rarity})`).join('\n')}

Rules:
- Pick the single most fitting species.
- reasoning must be a gentle one-sentence paraphrase, never quoting the user's words.
- suggestedActionType should match the creature's actionType when possible.
- If the text contains crisis language (self-harm, suicide, "can't go on"), set safetyFlag true and still pick a gentle species.
- Return ONLY the JSON object, no markdown, no explanation.`;

export async function classifyHandler(req: {
  text: string;
  valence?: number;
  arousal?: number;
}): Promise<ClassifyResult> {
  const { text, valence = 0, arousal = 0 } = req;

  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;

  if (!apiKey) {
    return localClassify(text, valence, arousal);
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-latest',
        max_tokens: 300,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: text }],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) throw new Error(`Anthropic API ${res.status}`);
    const data = await res.json();
    const content = data.content?.[0]?.text;
    if (!content) throw new Error('Empty response');

    const parsed = JSON.parse(content);
    const validated = validateClassifyResult(parsed);
    if (!validated) throw new Error('Invalid schema');
    return validated;
  } catch {
    return localClassify(text, valence, arousal);
  }
}

export async function taskSplitHandler(task: string): Promise<{ steps: string[] }> {
  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;

  if (!apiKey) {
    return {
      steps: [
        `Write down what "${task}" actually means — one sentence.`,
        `Find the very first small physical action (open a file, send one message).`,
        `Do only that first step. Set a 10-minute timer.`,
      ],
    };
  }

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-latest',
        max_tokens: 200,
        system: 'Break the user task into exactly 3 tiny, concrete, doable steps. Return ONLY a JSON array of 3 strings.',
        messages: [{ role: 'user', content: task }],
      }),
    });
    if (!res.ok) throw new Error();
    const data = await res.json();
    const steps = JSON.parse(data.content?.[0]?.text);
    if (Array.isArray(steps) && steps.length === 3) return { steps };
    throw new Error();
  } catch {
    return {
      steps: [
        `Write down what "${task}" actually means — one sentence.`,
        `Find the very first small physical action (open a file, send one message).`,
        `Do only that first step. Set a 10-minute timer.`,
      ],
    };
  }
}

// silence unused import in some bundlers
void CREATURE_MAP;

export type { SuggestedActionType };
