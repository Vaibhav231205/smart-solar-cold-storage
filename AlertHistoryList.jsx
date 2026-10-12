import { BellRing } from 'lucide-react';
import { LeafSprig } from '../common/LeafDecorations';
import LoadingSpinner from '../common/LoadingSpinner';
import { formatDateTime } from '../../utils/data';

function severityTone(severity) {
  if (severity === 'critical') {
    return 'bg-clay-100 text-clay-500';
  }

  if (severity === 'warning') {
    return 'bg-gold-100 text-gold-400';
  }

  return 'bg-sky-100 text-sky-400';
}

export default function AlertHistoryList({ alerts = [], loading = false }) {
  return (
    <div className="fade-rise rounded-[1.75rem] bg-white p-5 shadow-[0_24px_60px_-45px_rgba(36,50,31,0.7)] ring-1 ring-white/80">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-display text-lg font-semibold text-bark-900">Alert history</p>
          <p className="mt-1 text-sm text-bark-900/50">Recent events and controller warnings</p>
        </div>
        <div className="rounded-full bg-leaf-50 px-3 py-1 text-xs font-bold text-leaf-900">
          {alerts.length} item{alerts.length === 1 ? '' : 's'}
        </div>
      </div>

      <div className="vine-divider my-4" />

      {loading && !alerts.length ? (
        <LoadingSpinner label="Loading alert history..." />
      ) : alerts.length ? (
        <ul className="space-y-3">
          {alerts.map((alert) => (
            <li
              key={alert.id ?? `${alert.type}-${alert.timestamp}`}
              className="rounded-2xl bg-leaf-50/70 px-4 py-3 ring-1 ring-leaf-100"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.18em] ${severityTone(alert.severity)}`}>
                      {alert.severity ?? 'info'}
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-bark-900/35">
                      {alert.type ?? 'System'}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-bark-900/75">
                    {alert.message ?? 'No alert details available.'}
                  </p>
                </div>

                <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-bark-900/45 shadow-sm ring-1 ring-leaf-100">
                  <BellRing size={14} />
                  {formatDateTime(alert.timestamp)}
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center gap-2 py-8 text-center text-bark-900/40">
          <LeafSprig className="h-10 w-16 text-leaf-300" />
          <p className="text-sm">All quiet here. No alerts yet.</p>
        </div>
      )}
    </div>
  );
}
