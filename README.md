# Moodex — A Field Guide to Your Feelings

Moodex is a playful, private, local-first web app that works as a field guide to your feelings. You write one sentence about your day, and the app identifies a specific, nuanced emotion and "discovers" a cute creature species for it. Over time you fill your collection, building emotional vocabulary (emotional granularity).

**Moodex is a playful self-reflection tool. It is not a medical or therapy service.**

## How it works

1. **Write one sentence** about your day on the Home screen. Optionally adjust the "how pleasant" and "how much energy" sliders to help classification.
2. **Discover a creature.** The app searches its meadow and reveals a creature that matches your feeling — complete with a name, rarity, a gentle one-sentence explanation, and a small suggested action (breathing exercise, task-split, name-it prompt, etc.).
3. **Build your collection.** Each discovery is saved to your Field Guide. Discover all 40 species across 7 emotion groups (calm, energized, anxious, low, irritated, social, mixed).
4. **Track patterns.** The Journal timeline and Field Notes insights show you patterns — your most common creatures, time-of-day tendencies, diversity scores, and calm-vs-heavy trends.
5. **Share cards.** Generate a downloadable PNG trading card for any creature (never includes your journal text).

## Screens

- **Today** — Greeting from the guide character, sentence input, valence/arousal sliders, rotating prompts, searching animation, discovery reveal with mini-tools
- **Field Guide** — Grid of 40 species (discovered in color, undiscovered as silhouettes), progress ring, filters by emotion group and rarity, detail pages, achievements
- **Journal** — Timeline of entries, search, edit/delete, calendar heatmap colored by emotion group
- **Field Notes** — Handwritten pattern cards, Recharts radar/weekly bars/trend charts, keyword trigger extraction
- **Settings** — Privacy controls, export/import JSON, delete all data, theme toggle, sound toggle, reduce-motion toggle, offline-mode toggle, demo data loader

## Privacy

- **All journal data stays on your device** in IndexedDB via `idb-keyval`. Nothing is uploaded.
- The AI classifier (when enabled and a key is configured) sends only your single sentence for classification — nothing is stored server-side.
- An **"Offline mode only"** toggle ensures no sentence is ever sent anywhere, using the built-in rule-based classifier.
- Export/import your data as JSON at any time. Delete all data in one click.

## Responsible AI

- The LLM endpoint (`/api/classify`) calls the Anthropic API with a strict system prompt returning validated JSON (zod schema). If the response fails validation, times out (5s), or no key is configured, the app **automatically falls back** to the local rule-based classifier.
- The local classifier uses weighted keyword/phrase matching plus valence/arousal signals — the app works fully with no API key.
- **Safety:** If the text contains crisis language (self-harm, suicide, "can't go on"), the app shows a calm care screen with helplines (Tele-MANAS 14416, 988, Samaritans 116 123) instead of a creature reveal.
- The tone is warm, never shaming, never labels the user with a condition.

## Tech stack

- React + TypeScript + Vite + Tailwind CSS
- Framer Motion (animations), Zustand with IndexedDB persistence (idb-keyval)
- Recharts (insights), html-to-image (share cards), canvas-confetti, lucide-react
- Vitest for unit tests (19 tests covering classifier, crisis detection, zod validation, analytics)
- Serverless `/api/classify` endpoint with Anthropic API + local fallback

## Getting started

```bash
npm install
npm run dev      # start dev server
npm run build    # production build
npm test         # run tests
```

No API key required — the app works fully offline. To enable LLM classification, set `ANTHROPIC_API_KEY` in your environment.

## Demo data

In Settings, tap "Load demo data" to populate three weeks of realistic sample entries so the Field Guide and Field Notes look full immediately.

## Screenshots

_Add screenshots here after running the app._
