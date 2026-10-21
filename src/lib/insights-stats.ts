import { CREATURE_MAP } from '@/data/creatures';
import { GROUP_LABELS, GROUP_COLORS, EMOTION_GROUPS } from '@/types';
import type { EmotionGroup, JournalEntry } from '@/types';

export function computeStats(entries: JournalEntry[]) {
  const now = Date.now();
  const monthAgo = now - 30 * 24 * 60 * 60 * 1000;

  const counts: Record<string, number> = {};
  entries.forEach((e) => { counts[e.speciesId] = (counts[e.speciesId] || 0) + 1; });
  const sortedCounts = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const mostCommon = sortedCounts[0] ? { id: sortedCounts[0][0], count: sortedCounts[0][1] } : null;

  const uniqueThisMonth = new Set(entries.filter((e) => e.createdAt > monthAgo).map((e) => e.speciesId)).size;
  const totalDiscovered = new Set(entries.map((e) => e.speciesId)).size;

  const dates = [...new Set(entries.map((e) => new Date(e.createdAt).toDateString()))].sort();
  let currentStreak = 0;
  if (dates.length > 0) {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (dates[dates.length - 1] === today || dates[dates.length - 1] === yesterday) {
      currentStreak = 1;
      for (let i = dates.length - 2; i >= 0; i--) {
        const prev = new Date(dates[i + 1]);
        const curr = new Date(dates[i]);
        const diff = (prev.getTime() - curr.getTime()) / 86400000;
        if (Math.round(diff) === 1) currentStreak++;
        else break;
      }
    }
  }

  const timeSlots: Record<string, number> = { morning: 0, afternoon: 0, evening: 0, night: 0 };
  const weekdaySlots: Record<string, number> = {};
  entries.forEach((e) => {
    const h = new Date(e.createdAt).getHours();
    if (h < 12) timeSlots.morning++;
    else if (h < 17) timeSlots.afternoon++;
    else if (h < 22) timeSlots.evening++;
    else timeSlots.night++;
    const wd = new Date(e.createdAt).toLocaleDateString(undefined, { weekday: 'long' });
    weekdaySlots[wd] = (weekdaySlots[wd] || 0) + 1;
  });
  const topTime = Object.entries(timeSlots).sort((a, b) => b[1] - a[1])[0];
  const topWeekday = Object.entries(weekdaySlots).sort((a, b) => b[1] - a[1])[0];
  let timePattern: string | null = null;
  if (topTime && topTime[1] > 0 && topWeekday && topWeekday[1] > 1) {
    timePattern = `${topWeekday[0]} ${topTime[0]}s tend to be busy in your meadow — that's when the most creatures show up.`;
  }

  const stopWords = new Set(['the', 'a', 'an', 'i', 'my', 'me', 'to', 'and', 'of', 'in', 'on', 'at', 'is', 'was', 'it', 'for', 'with', 'that', 'this', 'but', 'had', 'have', 'been', 'not', 'so', 'too', 'very', 'just', 'really', 'about', 'from', 'they', 'them', 'him', 'her', 'we', 'you', 'your', 'our', 'as', 'be', 'are', 'were', 'or', 'if', 'can', 'do', 'did', 'has', 'would', 'could', 'should', 'will', 'got', 'get', 'going', 'some', 'more', 'out', 'up', 'down', 'over', 'all', 'one', 'two', 'than', 'then']);
  const wordCounts: Record<string, number> = {};
  entries.forEach((e) => {
    e.text.toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 3 && !stopWords.has(w)).forEach((w) => {
      wordCounts[w] = (wordCounts[w] || 0) + 1;
    });
  });
  const triggerWords = Object.entries(wordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([word, count]) => ({ word, count }));

  const radarData = EMOTION_GROUPS.map((g: EmotionGroup) => ({
    group: GROUP_LABELS[g],
    count: entries.filter((e) => CREATURE_MAP[e.speciesId]?.emotionGroup === g).length,
  }));

  const weeklyData = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const next = new Date(d);
    next.setDate(d.getDate() + 1);
    const dayEntries = entries.filter((e) => e.createdAt >= d.getTime() && e.createdAt < next.getTime());
    const group = dayEntries[0] ? CREATURE_MAP[dayEntries[0].speciesId]?.emotionGroup : undefined;
    weeklyData.push({
      day: d.toLocaleDateString(undefined, { weekday: 'short' }),
      count: dayEntries.length,
      color: group ? GROUP_COLORS[group] : 'rgba(59,47,47,0.1)',
    });
  }

  const trendData = [];
  for (let w = 3; w >= 0; w--) {
    const end = now - w * 7 * 86400000;
    const start = end - 7 * 86400000;
    const weekEntries = entries.filter((e) => e.createdAt >= start && e.createdAt < end);
    const calm = weekEntries.filter((e) => {
      const g = CREATURE_MAP[e.speciesId]?.emotionGroup;
      return g === 'calm' || g === 'energized' || g === 'social';
    }).length;
    const heavy = weekEntries.filter((e) => {
      const g = CREATURE_MAP[e.speciesId]?.emotionGroup;
      return g === 'low' || g === 'anxious' || g === 'irritated';
    }).length;
    trendData.push({ week: `W${4 - w}`, calm, heavy });
  }

  return {
    mostCommon,
    uniqueThisMonth,
    totalDiscovered,
    currentStreak,
    timePattern,
    triggerWords,
    radarData,
    weeklyData,
    trendData,
  };
}
