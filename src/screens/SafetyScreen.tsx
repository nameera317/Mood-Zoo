import { Heart, Phone, ExternalLink } from 'lucide-react';

type Props = {
  onContinue: () => void;
};

const HELPLINES = [
  { region: 'India', name: 'Tele-MANAS', number: '14416' },
  { region: 'United States', name: '988 Suicide & Crisis Lifeline', number: 'Call or text 988' },
  { region: 'UK & ROI', name: 'Samaritans', number: '116 123' },
];

export function SafetyScreen({ onContinue }: Props) {
  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <div className="paper-card p-6 sm:p-8 text-center">
        <Heart className="w-10 h-10 text-rose mx-auto mb-4" />
        <h2 className="font-head text-2xl font-bold text-ink">I hear you</h2>
        <p className="mt-3 text-ink-soft font-body leading-relaxed">
          What you wrote sounds heavy, and I am glad you put it into words.
          Moodex is a playful self-reflection tool — it is not a crisis service,
          and it cannot keep you safe the way a person can.
        </p>
        <p className="mt-3 text-ink-soft font-body leading-relaxed">
          Please reach out to someone you trust right now, or to one of these free, confidential lines.
          You do not have to be in immediate danger to call — they are there to listen.
        </p>

        <div className="mt-6 space-y-3 text-left">
          {HELPLINES.map((h) => (
            <div key={h.region} className="flex items-center justify-between bg-cream-deep rounded-xl px-4 py-3">
              <div>
                <div className="font-head font-semibold text-sm text-ink">{h.region}</div>
                <div className="text-xs text-ink-soft">{h.name}</div>
              </div>
              <div className="flex items-center gap-1.5 font-head font-bold text-sage-deep">
                <Phone className="w-4 h-4" />
                {h.number}
              </div>
            </div>
          ))}
          <a
            href="https://findahelpline.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 text-sm text-ink-soft hover:text-ink underline font-body pt-1"
          >
            Find a helpline in your country <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <p className="mt-6 text-sm text-ink-soft font-body">
          You matter, and the world is better with you in it.
        </p>

        <button onClick={onContinue} className="btn btn-ghost border border-[rgba(59,47,47,0.12)] mt-5">
          Continue
        </button>
      </div>
    </div>
  );
}
