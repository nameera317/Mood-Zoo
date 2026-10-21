import type { Plugin } from 'vite';

// Minimal inline classifier + crisis detection for the dev server.
// The production serverless function (api/classify.ts) uses the full implementation.
// This avoids `@/` alias resolution issues in the Vite config bundler.

const CRISIS_PATTERNS = [
  'kill myself', 'want to die', 'end my life', "can't go on", 'cant go on',
  'no reason to live', 'better off dead', 'suicide', 'suicidal', 'self harm',
  'self-harm', 'hurt myself', 'harming myself', 'overdose', 'end it all',
];

function detectCrisis(text: string): boolean {
  const lower = text.toLowerCase();
  return CRISIS_PATTERNS.some((p) => lower.includes(p));
}

const KEYWORDS: Record<string, string[]> = {
  calm: ['calm', 'peaceful', 'peace', 'quiet', 'relaxed', 'content', 'settled', 'steady', 'serene', 'cozy', 'grateful', 'thank'],
  energized: ['excited', 'hopeful', 'proud', 'curious', 'energized', 'motivated', 'inspired', 'eager', 'thrilled', 'buzzing', 'optimistic'],
  anxious: ['anxious', 'worried', 'nervous', 'dread', 'on edge', 'tense', 'panic', 'overwhelm', 'overwhelmed', 'overstimulated', 'racing', 'spiraling', 'overthinking', 'stressed', 'restless', 'jittery'],
  low: ['sad', 'down', 'low', 'heavy', 'lonely', 'alone', 'empty', 'hollow', 'numb', 'tired', 'exhausted', 'drained', 'homesick', 'discouraged', 'hopeless', 'blue', 'burnt out', 'burned out', 'burnout', 'depressed', 'weary', 'spent'],
  irritated: ['frustrated', 'annoyed', 'irritated', 'angry', 'mad', 'resentful', 'impatient', 'fed up', 'sick of', 'grumpy', 'bitter', 'snappy'],
  social: ['embarrassed', 'jealous', 'envious', 'left out', 'excluded', 'awkward', 'ashamed', 'guilty', 'unseen', 'invisible'],
  mixed: ['bittersweet', 'nostalgic', 'nostalgia', 'relieved', 'conflicted', 'torn', 'mixed', 'tender', 'wistful', 'melancholy', 'sentimental'],
};

const CREATURE_FALLBACK: Record<string, string> = {
  calm: 'mossling',
  energized: 'kindlewing',
  anxious: 'dread-moth',
  low: 'drizzle-cloud',
  irritated: 'ember-pup',
  social: 'blush-beetle',
  mixed: 'bittersweet-fox',
};

function localClassify(text: string, valence: number, arousal: number) {
  const lower = ' ' + text.toLowerCase() + ' ';
  const scores: Record<string, number> = {};
  for (const [group, kws] of Object.entries(KEYWORDS)) {
    let s = 0;
    for (const kw of kws) {
      if (lower.includes(kw)) s += 2;
    }
    if (s > 0) scores[group] = s;
  }

  // valence/arousal bias
  if (valence > 0.3 && arousal < 0) scores['calm'] = (scores['calm'] || 0) + 1.5;
  if (valence > 0.3 && arousal > 0.2) scores['energized'] = (scores['energized'] || 0) + 1.5;
  if (valence < -0.1 && arousal > 0.3) scores['anxious'] = (scores['anxious'] || 0) + 1.8;
  if (valence < -0.3) scores['low'] = (scores['low'] || 0) + 1.8;
  if (valence < -0.2 && arousal > 0.2) scores['irritated'] = (scores['irritated'] || 0) + 1.2;
  if (Math.abs(valence) < 0.25) scores['mixed'] = (scores['mixed'] || 0) + 1.0;

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const primary = sorted[0]?.[0] || (valence > 0.3 ? 'calm' : valence < -0.3 ? 'low' : 'mixed');
  const secondary = sorted[1]?.[0] || null;

  return {
    speciesId: CREATURE_FALLBACK[primary] || 'mossling',
    secondarySpeciesId: secondary ? CREATURE_FALLBACK[secondary] || null : null,
    confidence: Math.min(0.9, Math.max(0.4, (sorted[0]?.[1] || 1) / 5)),
    reasoning: `This reads like a ${primary} kind of day.`,
    suggestedActionType: 'breathing' as const,
    safetyFlag: false,
  };
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export function apiPlugin(): Plugin {
  return {
    name: 'moodex-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next();

        if (req.method === 'OPTIONS') {
          res.writeHead(200, corsHeaders);
          res.end();
          return;
        }

        if (req.method !== 'POST') {
          res.writeHead(405, { 'Content-Type': 'application/json', ...corsHeaders });
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        let body = '';
        for await (const chunk of req) body += chunk;

        let parsed: unknown;
        try {
          parsed = JSON.parse(body);
        } catch {
          res.writeHead(400, { 'Content-Type': 'application/json', ...corsHeaders });
          res.end(JSON.stringify({ error: 'Invalid JSON' }));
          return;
        }

        try {
          if (req.url === '/api/classify') {
            const { text, valence, arousal } = parsed as { text: string; valence?: number; arousal?: number };
            if (typeof text !== 'string' || !text.trim()) {
              res.writeHead(400, { 'Content-Type': 'application/json', ...corsHeaders });
              res.end(JSON.stringify({ error: 'text required' }));
              return;
            }
            if (detectCrisis(text)) {
              res.writeHead(200, { 'Content-Type': 'application/json', ...corsHeaders });
              res.end(JSON.stringify({
                speciesId: 'mossling',
                secondarySpeciesId: null,
                confidence: 1,
                reasoning: '',
                suggestedActionType: 'breathing',
                safetyFlag: true,
              }));
              return;
            }
            const result = localClassify(text, valence || 0, arousal || 0);
            res.writeHead(200, { 'Content-Type': 'application/json', ...corsHeaders });
            res.end(JSON.stringify(result));
            return;
          }

          if (req.url === '/api/task-split') {
            const { task } = parsed as { task: string };
            res.writeHead(200, { 'Content-Type': 'application/json', ...corsHeaders });
            res.end(JSON.stringify({
              steps: [
                `Write down what "${task}" actually means — one sentence.`,
                `Find the very first small physical action (open a file, send one message).`,
                `Do only that first step. Set a 10-minute timer.`,
              ],
            }));
            return;
          }

          res.writeHead(404, { 'Content-Type': 'application/json', ...corsHeaders });
          res.end(JSON.stringify({ error: 'Not found' }));
        } catch {
          res.writeHead(500, { 'Content-Type': 'application/json', ...corsHeaders });
          res.end(JSON.stringify({ error: 'Server error' }));
        }
      });
    },
  };
}
