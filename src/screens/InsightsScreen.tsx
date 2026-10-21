import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell,
} from 'recharts';
import { CREATURE_MAP } from '@/data/creatures';
import { useStore } from '@/store';
import { computeStats } from '@/lib/insights-stats';

export function InsightsScreen() {
  const entries = useStore((s) => s.entries);

  const stats = useMemo(() => computeStats(entries), [entries]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
      <h1 className="font-head text-2xl sm:text-3xl font-bold text-ink mb-2">Field Notes</h1>
      <p className="text-sm text-ink-soft/60 font-body italic mb-6">
        These are playful patterns, not a diagnosis.
      </p>

      {entries.length === 0 ? (
        <div className="paper-card p-10 text-center">
          <p className="font-hand text-2xl text-ink-soft">No notes yet.</p>
          <p className="text-sm text-ink-soft/60 mt-2 font-body">Check in a few times and patterns will appear here.</p>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <PatternCard title="Most common creature">
              {stats.mostCommon ? (
                <>
                  <span className="font-head font-bold text-ink">{CREATURE_MAP[stats.mostCommon.id]?.name}</span>
                  <span className="text-ink-soft"> shows up most — {stats.mostCommon.count} times.</span>
                </>
              ) : <span className="text-ink-soft">Still gathering...</span>}
            </PatternCard>

            <PatternCard title="Diversity this month">
              You named <span className="font-head font-bold text-ink">{stats.uniqueThisMonth}</span> different
              feelings this month.
            </PatternCard>

            <PatternCard title="Streak">
              You've checked in <span className="font-head font-bold text-ink">{stats.currentStreak}</span> day{stats.currentStreak !== 1 ? 's' : ''} in a row.
            </PatternCard>

            <PatternCard title="Total discoveries">
              <span className="font-head font-bold text-ink">{stats.totalDiscovered}</span> of 40 species in your guide.
            </PatternCard>
          </div>

          {stats.timePattern && (
            <PatternCard title="When they visit">
              {stats.timePattern}
            </PatternCard>
          )}

          {stats.triggerWords.length > 0 && (
            <div className="paper-card p-5">
              <h2 className="font-head text-lg font-semibold text-ink mb-3">Habitat triggers</h2>
              <div className="flex flex-wrap gap-2">
                {stats.triggerWords.map((w) => (
                  <span key={w.word} className="chip bg-cream-deep text-ink-soft font-body">
                    {w.word} <span className="opacity-50">· {w.count}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="paper-card p-5">
            <h2 className="font-head text-lg font-semibold text-ink mb-4">Emotion groups</h2>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={stats.radarData}>
                <PolarGrid stroke="rgba(59,47,47,0.1)" />
                <PolarAngleAxis dataKey="group" tick={{ fill: '#6B5D4F', fontSize: 11 }} />
                <Radar dataKey="count" stroke="#9DBF9E" fill="#9DBF9E" fillOpacity={0.5} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="paper-card p-5">
            <h2 className="font-head text-lg font-semibold text-ink mb-4">Last 7 days</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.weeklyData}>
                <XAxis dataKey="day" tick={{ fill: '#6B5D4F', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: '#6B5D4F', fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
                <Tooltip
                  contentStyle={{ background: '#FBF6EC', border: '1px solid rgba(59,47,47,0.1)', borderRadius: 12, fontSize: 12 }}
                  labelStyle={{ color: '#3B2F2F', fontWeight: 600 }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {stats.weeklyData.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {stats.trendData.length > 1 && (
            <div className="paper-card p-5">
              <h2 className="font-head text-lg font-semibold text-ink mb-4">Calm vs. heavy trend</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats.trendData}>
                  <XAxis dataKey="week" tick={{ fill: '#6B5D4F', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fill: '#6B5D4F', fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip
                    contentStyle={{ background: '#FBF6EC', border: '1px solid rgba(59,47,47,0.1)', borderRadius: 12, fontSize: 12 }}
                  />
                  <Bar dataKey="calm" stackId="a" fill="#9DBF9E" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="heavy" stackId="a" fill="#C5B3E6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex gap-4 justify-center mt-2 text-xs text-ink-soft">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-sage" /> Calm/Energized</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-lilac" /> Low/Anxious</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PatternCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={false}
      className="paper-card p-5 relative"
    >
      <div className="absolute top-2 right-3 w-12 h-3 opacity-30" style={{ background: '#F7B79A', transform: 'rotate(-3deg)' }} />
      <h2 className="font-head text-sm font-semibold text-ink-soft mb-2">{title}</h2>
      <p className="font-hand text-lg text-ink leading-snug">{children}</p>
    </motion.div>
  );
}
