import { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { Download, Copy, X } from 'lucide-react';
import { Creature } from '@/components/Creature';
import { CREATURE_MAP } from '@/data/creatures';
import { RARITY_COLORS } from '@/types';
import { useStore } from '@/store';
import { useToast } from '@/components/Toast';

type Props = {
  speciesId: string;
  onClose: () => void;
};

export function ShareCard({ speciesId, onClose }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const creature = CREATURE_MAP[speciesId];
  const entries = useStore((s) => s.entries);
  const discoveredCount = new Set(entries.map((e) => e.speciesId)).size;
  const addToast = useToast((s) => s.addToast);
  const [busy, setBusy] = useState(false);

  if (!creature) return null;

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setBusy(true);
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, cacheBust: true });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `moodex-${creature.id}.png`;
      a.click();
      addToast('Saved your trading card.', 'success');
    } catch {
      addToast('Could not generate the image.', 'warning');
    } finally {
      setBusy(false);
    }
  };

  const handleCopyCaption = () => {
    const caption = `I discovered a ${creature.name} in Moodex — a creature for feeling ${creature.emotion.toLowerCase()}. ${discoveredCount}/40 in my field guide. A cozy way to grow your emotional vocabulary. #Moodex`;
    navigator.clipboard.writeText(caption).then(
      () => addToast('Caption copied to clipboard.', 'success'),
      () => addToast('Could not copy.', 'warning'),
    );
  };

  return (
    <div className="fixed inset-0 z-40 bg-black/30 flex items-center justify-center p-4" onClick={onClose}>
      <div className="flex flex-col items-center gap-4" onClick={(e) => e.stopPropagation()}>
        <div
          ref={cardRef}
          className="relative bg-[#FBF6EC] rounded-2xl p-6 w-[340px] overflow-hidden"
          style={{
            backgroundImage: 'radial-gradient(circle at 20% 10%, rgba(157,191,158,0.15), transparent 50%), radial-gradient(circle at 80% 90%, rgba(247,183,154,0.15), transparent 50%)',
          }}
        >
          <div className="absolute top-3 right-4 w-16 h-4 opacity-40" style={{ background: '#F7B79A', transform: 'rotate(8deg)' }} />
          <div className="flex flex-col items-center text-center pt-2">
            <Creature creature={creature} size={130} interactive={false} showSparkles />
            <div className="font-head text-2xl font-bold text-[#3B2F2F] mt-2">{creature.name}</div>
            <div className="text-sm text-[#6B5D4F] font-body">{creature.emotion}</div>
            <div
              className="mt-2 inline-block px-3 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-head border-2"
              style={{ color: RARITY_COLORS[creature.rarity], borderColor: RARITY_COLORS[creature.rarity] }}
            >
              {creature.rarity}
            </div>
            <p className="mt-3 text-xs text-[#6B5D4F] font-body leading-relaxed px-2">{creature.description}</p>
            <div className="mt-3 pt-3 border-t border-[rgba(59,47,47,0.1)] w-full">
              <span className="font-head text-sm font-semibold text-[#3B2F2F]">Moodex</span>
              <span className="text-xs text-[#6B5D4F] font-body"> · Discovered {discoveredCount}/40</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={handleDownload} disabled={busy} className="btn btn-primary text-sm">
            <Download className="w-4 h-4" /> {busy ? 'Generating...' : 'Download PNG'}
          </button>
          <button onClick={handleCopyCaption} className="btn btn-ghost border border-[rgba(59,47,47,0.12)] text-sm">
            <Copy className="w-4 h-4" /> Copy caption
          </button>
          <button onClick={onClose} className="btn btn-ghost text-sm" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
