import { AlertTriangle, Info, OctagonAlert } from 'lucide-react';

const SEVERITY = {
  critical: {
    style: 'border-clay-500/20 bg-clay-100/90 text-clay-500',
    Icon: OctagonAlert,
    label: 'Critical',
  },
  warning: {
    style: 'border-gold-400/25 bg-gold-100/90 text-gold-400',
    Icon: AlertTriangle,
    label: 'Warning',
  },
  info: {
    style: 'border-sky-400/25 bg-sky-100/90 text-sky-400',
    Icon: Info,
    label: 'Info',
  },
};

export default function AlertBanner({ alert }) {
  const { style, Icon, label } = SEVERITY[alert.severity] ?? SEVERITY.info;

  return (
    <div className={`fade-rise flex items-start gap-3 rounded-[1.5rem] border px-4 py-3 text-sm font-semibold shadow-[0_18px_40px_-34px_rgba(36,50,31,0.55)] ${style}`}>
      <Icon size={18} className="mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] opacity-70">{label}</p>
        <p className="mt-1 leading-6">{alert.message ?? 'No alert details available.'}</p>
      </div>
    </div>
  );
}
