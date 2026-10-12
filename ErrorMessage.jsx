import { OctagonAlert } from 'lucide-react';

export default function ErrorMessage({ error }) {
  if (!error) return null;

  return (
    <div className="flex items-start gap-3 rounded-[1.5rem] border border-clay-500/20 bg-clay-100/90 px-4 py-3 text-sm font-semibold leading-6 text-clay-500 shadow-[0_18px_40px_-34px_rgba(217,88,79,0.9)]">
      <OctagonAlert size={18} className="mt-0.5 shrink-0" />
      <span>{error.message ?? "Couldn't reach the cold storage unit. We'll keep trying."}</span>
    </div>
  );
}
