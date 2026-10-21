import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Award, Filter, Share2 } from 'lucide-react';
import { Creature, CreatureSilhouette } from '@/components/Creature';
import { CREATURES, CREATURE_MAP, ACHIEVEMENTS } from '@/data/creatures';
import { GROUP_LABELS, GROUP_COLORS, RARITY_LABELS, RARITY_COLORS } from '@/types';
import type { EmotionGroup, Rarity, Achievement } from '@/types';
import { useStore } from '@/store';

const ACHIEVEMENT_ICONS: Record<string, typeof Award> = { award: Award };

export function FieldGuideScreen({ onShare }: { onShare?: (id: string) => void }) {
  const entries = useStore((s) => s.entries);
  const [filterGroup, setFilterGroup] = useState<EmotionGroup | 'all'>('all');
  const [filterRarity, setFilterRarity] = useState<Rarity | 'all'>('all');
  const [selected, setSelected] = useState<string | null>(null);

  const discoveredIds = useMemo(() => new Set(entries.map((e) => e.speciesId)), [entries]);
  const discoveredCount = discoveredIds.size;
  const progress = (discoveredCount / CREATURES.length) * 100;

  const filtered = CREATURES.filter((c) => {
    if (filterGroup !== 'all' && c.emotionGroup !== filterGroup) return false;
    if (filterRarity !== 'all' && c.rarity !== filterRarity) return false;
    return true;
  });

  const earnedAchievements = useMemo(() => {
    const earned: Record<string, boolean> = {
      'first-discovery': discoveredCount >= 1,
      'naming-things': discoveredCount >= 10,
      'emotional-explorer': discoveredCount >= 25,
      'full-guide': discoveredCount >= 40,
      'rare-find': CREATURES.some((c) => discoveredIds.has(c.id) && (c.rarity === 'rare' || c.rarity === 'legendary')),
    };
    const dates = [...new Set(entries.map((e) => new Date(e.createdAt).toDateString()))].sort();
    let streak = 1;
    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1]);
      const curr = new Date(dates[i]);
      const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
      if (Math.round(diff) === 1) streak++;
      else break;
    }
    earned['seven-day-streak'] = streak >= 7;
    return earned;
  }, [entries, discoveredIds, discoveredCount]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="font-head text-2xl sm:text-3xl font-bold text-ink">Field Guide</h1>

        <div className="flex items-center gap-3">
          <div className="relative w-24 h-24">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(59,47,47,0.08)" strokeWidth="8" />
              <motion.circle
                cx="50" cy="50" r="42" fill="none" stroke="#9DBF9E" strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 42}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - progress / 100) }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="font-head font-bold text-lg text-ink">{discoveredCount}</span>
              <span className="text-[10px] text-ink-soft">/ {CREATURES.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="mb-6">
        <h2 className="font-head text-lg font-semibold text-ink mb-3 flex items-center gap-2">
          <Award className="w-5 h-5 text-butter" /> Achievements
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {ACHIEVEMENTS.map((a: Achievement) => {
            const earned = earnedAchievements[a.id];
            const Icon = ACHIEVEMENT_ICONS[a.icon] || Award;
            return (
              <div
                key={a.id}
                className={`paper-card p-3 flex items-center gap-3 ${earned ? '' : 'opacity-40 grayscale'}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${earned ? 'bg-butter' : 'bg-cream-deep'}`}>
                  <Icon className="w-5 h-5 text-ink" />
                </div>
                <div>
                  <div className="font-head font-semibold text-sm text-ink">{a.title}</div>
                  <div className="text-[11px] text-ink-soft">{a.description}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Filter className="w-4 h-4 text-ink-soft" />
        <FilterChip label="All" active={filterGroup === 'all'} onClick={() => setFilterGroup('all')} />
        {(Object.keys(GROUP_LABELS) as EmotionGroup[]).map((g) => (
          <FilterChip
            key={g}
            label={GROUP_LABELS[g]}
            color={GROUP_COLORS[g]}
            active={filterGroup === g}
            onClick={() => setFilterGroup(g)}
          />
        ))}
        <span className="w-px h-5 bg-[rgba(59,47,47,0.1)] mx-1" />
        <FilterChip label="Any rarity" active={filterRarity === 'all'} onClick={() => setFilterRarity('all')} />
        {(Object.keys(RARITY_LABELS) as Rarity[]).map((r) => (
          <FilterChip
            key={r}
            label={RARITY_LABELS[r]}
            color={RARITY_COLORS[r]}
            active={filterRarity === r}
            onClick={() => setFilterRarity(r)}
          />
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 sm:gap-4">
        {filtered.map((c, i) => {
          const discovered = discoveredIds.has(c.id);
          return (
            <motion.button
              key={c.id}
              layout
              initial={false}
              onClick={() => setSelected(c.id)}
              className="paper-card p-3 flex flex-col items-center hover:scale-[1.04] transition-transform"
              style={{ animationDelay: `${i * 20}ms` }}
            >
              {discovered ? (
                <Creature creature={c} size={80} interactive={false} />
              ) : (
                <CreatureSilhouette size={80} className="text-ink-soft" />
              )}
              <span className={`font-head text-xs font-semibold mt-1.5 text-center ${discovered ? 'text-ink' : 'text-ink-soft/40'}`}>
                {discovered ? c.name : '???'}
              </span>
              <span className="text-[10px] text-ink-soft/60">{discovered ? c.emotion : 'Undiscovered'}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Detail modal */}
      <AnimatePresence>
        {selected && (
          <DetailModal id={selected} onClose={() => setSelected(null)} onShare={onShare} />
        )}
      </AnimatePresence>
    </div>
  );
}

function FilterChip({ label, active, onClick, color }: { label: string; active: boolean; onClick: () => void; color?: string }) {
  return (
    <button
      onClick={onClick}
      className={`chip border transition-all ${active ? 'text-ink border-transparent' : 'text-ink-soft border-[rgba(59,47,47,0.1)] bg-transparent'}`}
      style={active && color ? { backgroundColor: color + '30', borderColor: color } : active ? { backgroundColor: 'rgba(59,47,47,0.06)' } : {}}
    >
      {label}
    </button>
  );
}

function DetailModal({ id, onClose, onShare }: { id: string; onClose: () => void; onShare?: (id: string) => void }) {
  const c = CREATURE_MAP[id];
  const entries = useStore((s) => s.entries);
  const creatureEntries = entries.filter((e) => e.speciesId === id);

  if (!c) return null;

  const timesSeen = creatureEntries.length;
  const firstSeen = creatureEntries.length > 0 ? new Date(creatureEntries[creatureEntries.length - 1].createdAt).toLocaleDateString() : null;
  const lastSeen = creatureEntries.length > 0 ? new Date(creatureEntries[0].createdAt).toLocaleDateString() : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-40 bg-black/30 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="paper-card p-6 sm:p-8 max-w-md w-full relative max-h-[90vh] overflow-y-auto scrollbar-thin"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-ink-soft hover:text-ink" aria-label="Close">
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center">
          <Creature creature={c} size={140} showSparkles />
          <h2 className="font-head text-2xl font-bold text-ink mt-2">{c.name}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-ink-soft font-body">{c.emotion}</span>
            <span className="stamp" style={{ color: RARITY_COLORS[c.rarity] }}>{c.rarity}</span>
          </div>
        </div>

        <p className="mt-4 text-sm text-ink-soft font-body leading-relaxed">{c.description}</p>

        <div className="mt-4 space-y-2 text-sm">
          <DetailRow label="Habitat" value={c.habitat} />
          <DetailRow label="Times seen" value={String(timesSeen)} />
          {firstSeen && <DetailRow label="First seen" value={firstSeen} />}
          {lastSeen && <DetailRow label="Last seen" value={lastSeen} />}
        </div>

        <div className="mt-4 paper-card bg-cream-deep p-3 text-center">
          <p className="font-hand text-lg text-ink-soft">"{c.fieldNote}"</p>
        </div>

        {onShare && (
          <button onClick={() => onShare(id)} className="btn btn-ghost border border-[rgba(59,47,47,0.12)] mt-4 w-full text-sm">
            <Share2 className="w-4 h-4" /> Share this card
          </button>
        )}
      </motion.div>
    </motion.div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-ink-soft/60 font-body">{label}</span>
      <span className="text-ink font-body font-semibold text-right">{value}</span>
    </div>
  );
}
