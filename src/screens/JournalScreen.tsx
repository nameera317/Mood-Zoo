import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Trash2, Edit3, X, Check } from 'lucide-react';
import { Creature } from '@/components/Creature';
import { CREATURE_MAP } from '@/data/creatures';
import { GROUP_COLORS } from '@/types';
import { useStore } from '@/store';
import { useToast } from '@/components/Toast';

export function JournalScreen() {
  const entries = useStore((s) => s.entries);
  const deleteEntry = useStore((s) => s.deleteEntry);
  const updateEntry = useStore((s) => s.updateEntry);
  const addToast = useToast((s) => s.addToast);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return entries;
    const q = search.toLowerCase();
    return entries.filter((e) => e.text.toLowerCase().includes(q));
  }, [entries, search]);

  const handleDelete = (id: string) => {
    deleteEntry(id);
    addToast('Entry removed.', 'info');
  };

  const startEdit = (id: string, text: string) => {
    setEditing(id);
    setEditText(text);
  };

  const saveEdit = () => {
    if (editing) {
      updateEntry(editing, editText);
      addToast('Updated.', 'success');
    }
    setEditing(null);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
      <h1 className="font-head text-2xl sm:text-3xl font-bold text-ink mb-6">Journal</h1>

      {entries.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="relative mb-5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-soft/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search your entries..."
              className="w-full paper-card pl-10 pr-4 py-2.5 text-sm text-ink outline-none font-body"
              aria-label="Search journal entries"
            />
          </div>

          <CalendarHeatmap entries={entries} />

          <div className="mt-6 space-y-3">
            <AnimatePresence>
              {filtered.map((entry) => {
                const creature = CREATURE_MAP[entry.speciesId];
                if (!creature) return null;
                const isEditing = editing === entry.id;
                return (
                  <motion.div
                    key={entry.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="paper-card p-4 flex gap-4 items-start"
                  >
                    <div className="flex-shrink-0">
                      <Creature creature={creature} size={56} interactive={false} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs text-ink-soft/60 font-body">
                          {new Date(entry.createdAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                          {' · '}
                          {new Date(entry.createdAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                        </span>
                        <div className="flex gap-1">
                          {!isEditing && (
                            <>
                              <button onClick={() => startEdit(entry.id, entry.text)} className="text-ink-soft/40 hover:text-ink-soft p-1" aria-label="Edit entry">
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => handleDelete(entry.id)} className="text-ink-soft/40 hover:text-rose p-1" aria-label="Delete entry">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      {isEditing ? (
                        <div>
                          <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            rows={2}
                            className="w-full bg-cream-deep px-3 py-2 rounded-lg text-sm text-ink outline-none border border-[rgba(59,47,47,0.08)] resize-none font-body"
                          />
                          <div className="flex gap-2 mt-2">
                            <button onClick={saveEdit} className="btn btn-primary text-xs px-3 py-1.5"><Check className="w-3 h-3" /> Save</button>
                            <button onClick={() => setEditing(null)} className="btn btn-ghost text-xs px-3 py-1.5"><X className="w-3 h-3" /> Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-ink font-body leading-relaxed">{entry.text}</p>
                      )}
                      {!isEditing && (
                        <div className="mt-1.5 flex items-center gap-2">
                          <span className="text-xs font-head font-semibold text-ink-soft">{creature.name}</span>
                          <span className="text-[10px] text-ink-soft/50">·</span>
                          <span className="text-xs text-ink-soft/60">{creature.emotion}</span>
                          {entry.wasCorrection && <span className="text-[10px] text-ink-soft/40">(corrected)</span>}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {filtered.length === 0 && (
              <p className="text-center text-sm text-ink-soft/50 py-8 font-body">No entries match "{search}".</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="paper-card p-10 text-center">
      <p className="font-hand text-2xl text-ink-soft">The meadow is quiet.</p>
      <p className="text-sm text-ink-soft/60 mt-2 font-body">Tell me about your day and I'll look around.</p>
    </div>
  );
}

function CalendarHeatmap({ entries }: { entries: { createdAt: number; speciesId: string }[] }) {
  const days = useMemo(() => {
    const today = new Date();
    const days: { date: Date; count: number; group?: string }[] = [];
    for (let i = 83; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const dayEntries = entries.filter((e) => {
        const ed = new Date(e.createdAt);
        ed.setHours(0, 0, 0, 0);
        return ed.getTime() === d.getTime();
      });
      const group = dayEntries[0] ? CREATURE_MAP[dayEntries[0].speciesId]?.emotionGroup : undefined;
      days.push({ date: d, count: dayEntries.length, group });
    }
    return days;
  }, [entries]);

  return (
    <div className="paper-card p-4">
      <div className="text-xs font-semibold text-ink-soft mb-2 font-head">Last 12 weeks</div>
      <div className="grid grid-flow-col grid-rows-7 gap-1" style={{ gridAutoColumns: 'minmax(0, 1fr)' }}>
        {days.map((d, i) => (
          <div
            key={i}
            className="aspect-square rounded-sm transition-transform hover:scale-125"
            style={{
              backgroundColor: d.count > 0 && d.group ? GROUP_COLORS[d.group as keyof typeof GROUP_COLORS] : 'rgba(59,47,47,0.06)',
              opacity: d.count > 0 ? 0.85 : 1,
            }}
            title={`${d.date.toLocaleDateString()}: ${d.count} ${d.count === 1 ? 'entry' : 'entries'}`}
          />
        ))}
      </div>
    </div>
  );
}
