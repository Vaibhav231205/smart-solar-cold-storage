import { BellRing, Clock3 } from 'lucide-react';
import { LeafMark } from '../common/LeafDecorations';
import DeviceStatusBadge from '../dashboard/DeviceStatusBadge';
import { formatClock } from '../../utils/data';

export default function Navbar({ isOnline, apiEnabled = true, activeAlerts = 0, lastUpdated }) {
  return (
    <header className="sticky top-0 z-20 border-b border-white/30 bg-leaf-900/95 px-4 py-4 text-cream backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:px-2">
        <div className="flex items-center gap-3">
          <LeafMark className="h-10 w-10 text-leaf-500" />
          <div>
            <h1 className="font-display text-xl font-semibold leading-tight sm:text-2xl">
              Harvest Guard
            </h1>
            <p className="text-sm text-leaf-100/80">Cold storage, watched over</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-cream/85 ring-1 ring-white/10">
            <Clock3 size={14} />
            Updated {formatClock(lastUpdated)}
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-cream/85 ring-1 ring-white/10">
            <BellRing size={14} />
            {activeAlerts} active alert{activeAlerts === 1 ? '' : 's'}
          </div>
          <DeviceStatusBadge isOnline={isOnline} apiEnabled={apiEnabled} />
        </div>
      </div>
    </header>
  );
}
