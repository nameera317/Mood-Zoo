import { useRef } from 'react';
import { Download, Upload, Trash2, Moon, Sun, Volume2, VolumeX, Wind, Wifi, WifiOff, Sparkles } from 'lucide-react';
import { useStore } from '@/store';
import { useToast } from '@/components/Toast';

export function SettingsScreen({ onLoadDemo }: { onLoadDemo: () => void }) {
  const theme = useStore((s) => s.theme);
  const soundEnabled = useStore((s) => s.soundEnabled);
  const reduceMotion = useStore((s) => s.reduceMotion);
  const offlineOnly = useStore((s) => s.offlineOnly);
  const entries = useStore((s) => s.entries);
  const toggleTheme = useStore((s) => s.toggleTheme);
  const setSound = useStore((s) => s.setSound);
  const setReduceMotion = useStore((s) => s.setReduceMotion);
  const setOfflineOnly = useStore((s) => s.setOfflineOnly);
  const clearAll = useStore((s) => s.clearAll);
  const importData = useStore((s) => s.importData);
  const addToast = useToast((s) => s.addToast);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const data = JSON.stringify({ entries, exportedAt: new Date().toISOString() }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `moodex-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Exported your data.', 'success');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        if (Array.isArray(parsed.entries)) {
          importData({ entries: parsed.entries });
          addToast('Imported your data.', 'success');
        } else {
          addToast('That file does not look right.', 'warning');
        }
      } catch {
        addToast('Could not read that file.', 'warning');
      }
    };
    reader.readAsText(file);
  };

  const handleClear = () => {
    if (confirm('Delete all your entries and discoveries? This cannot be undone.')) {
      clearAll();
      addToast('All data cleared.', 'info');
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8">
      <h1 className="font-head text-2xl sm:text-3xl font-bold text-ink mb-6">Settings & Privacy</h1>

      {/* Privacy */}
      <Section title="Your data never leaves this device">
        <p className="text-sm text-ink-soft font-body leading-relaxed">
          Everything you write stays in your browser's local storage on this device. Nothing is uploaded
          to a server unless the AI classifier is enabled, and even then, only your single sentence is
          sent — never stored — to identify the feeling. You can turn that off below.
        </p>
        <div className="mt-4 space-y-2">
          <SettingRow icon={Download} label="Export your data (JSON)" onClick={handleExport} />
          <SettingRow icon={Upload} label="Import data (JSON)" onClick={() => fileRef.current?.click()} />
          <input ref={fileRef} type="file" accept="application/json" onChange={handleImport} className="hidden" />
          <SettingRow icon={Trash2} label="Delete all data" onClick={handleClear} danger />
        </div>
      </Section>

      {/* AI / Offline */}
      <Section title="AI classifier">
        <ToggleRow
          icon={offlineOnly ? WifiOff : Wifi}
          label="Offline mode only"
          description="When on, only the built-in on-device classifier is used. No sentence is ever sent anywhere."
          checked={offlineOnly}
          onChange={setOfflineOnly}
        />
        {!offlineOnly && (
          <p className="text-xs text-ink-soft/60 font-body mt-2 leading-relaxed">
            When off and a key is configured, only your single sentence is sent for classification.
            Nothing is stored server-side. If the API is unavailable, the app falls back to the local
            classifier automatically.
          </p>
        )}
      </Section>

      {/* Appearance */}
      <Section title="Appearance & sound">
        <ToggleRow
          icon={theme === 'night' ? Moon : Sun}
          label="Night Journal theme"
          description="A darker, gentler palette for evening reflections."
          checked={theme === 'night'}
          onChange={() => toggleTheme()}
        />
        <ToggleRow
          icon={soundEnabled ? Volume2 : VolumeX}
          label="Soft sounds"
          description="Gentle chimes on discovery. Off by default."
          checked={soundEnabled}
          onChange={setSound}
        />
        <ToggleRow
          icon={Wind}
          label="Reduce motion"
          description="Minimize animations and transitions."
          checked={reduceMotion}
          onChange={setReduceMotion}
        />
      </Section>

      {/* Demo */}
      <Section title="Demo data">
        <p className="text-sm text-ink-soft font-body leading-relaxed">
          Load three weeks of realistic sample entries so the Field Guide and Field Notes look full
          immediately. Great for showing Moodex to someone.
        </p>
        <div className="mt-3">
          <button onClick={onLoadDemo} className="btn btn-ghost border border-[rgba(59,47,47,0.12)] text-sm">
            <Sparkles className="w-4 h-4" /> {entries.length > 0 ? 'Demo data already loaded' : 'Load demo data'}
          </button>
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="paper-card p-5 mb-4">
      <h2 className="font-head text-lg font-semibold text-ink mb-3">{title}</h2>
      {children}
    </div>
  );
}

function SettingRow({ icon: Icon, label, onClick, danger }: { icon: typeof Download; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body hover:bg-cream-deep transition-colors ${danger ? 'text-rose' : 'text-ink'}`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

function ToggleRow({ icon: Icon, label, description, checked, onChange }: { icon: typeof Download; label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <div className="flex items-start gap-3 flex-1">
        <Icon className="w-4 h-4 mt-0.5 text-ink-soft" />
        <div>
          <div className="text-sm font-semibold text-ink font-body">{label}</div>
          <div className="text-xs text-ink-soft/60 font-body">{description}</div>
        </div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${checked ? 'bg-sage-deep' : 'bg-[rgba(59,47,47,0.15)]'}`}
        role="switch"
        aria-checked={checked}
        aria-label={label}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-cream transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  );
}
