import { Snowflake, Thermometer, TriangleAlert, Wifi, WifiOff } from 'lucide-react';
import { CornerLeaves } from '../common/LeafDecorations';
import { formatClock } from '../../utils/data';

function describeTemp(tempC, targetC) {
  if (tempC == null) return { label: 'Waiting for a reading...', tone: 'neutral' };
  if (targetC != null && tempC <= targetC + 0.5) {
    return { label: 'Nice and cool', tone: 'good' };
  }
  if (targetC != null && tempC <= targetC + 2) {
    return { label: 'A little warm, keep an eye on it', tone: 'warn' };
  }
  if (targetC != null) return { label: 'Too warm, check the unit', tone: 'bad' };
  return { label: 'Current temperature', tone: 'neutral' };
}

const TONE_STYLES = {
  good: 'text-leaf-900',
  warn: 'text-gold-400',
  bad: 'text-clay-500',
  neutral: 'text-bark-900/60',
};

function formatTemperature(value) {
  if (value == null) {
    return '--';
  }

  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function describeGap(tempC, targetC) {
  if (tempC == null || targetC == null) {
    return 'The live target will show here as soon as the controller responds.';
  }

  const delta = tempC - targetC;

  if (Math.abs(delta) < 0.5) {
    return 'The chamber is holding very close to the target.';
  }

  if (delta > 0) {
    return `${delta.toFixed(1)} C above target right now.`;
  }

  return `${Math.abs(delta).toFixed(1)} C below target right now.`;
}

export default function TemperatureCard({
  tempC,
  targetC,
  isOnline,
  apiEnabled = true,
  lastSignalAt,
  activeAlertCount = 0,
  coolingOn,
  loading = false,
}) {
  const status = describeTemp(tempC, targetC);
  const statusText = describeGap(tempC, targetC);

  return (
    <div className="relative overflow-hidden rounded-[2rem] bg-white px-6 py-7 shadow-[0_28px_70px_-42px_rgba(36,50,31,0.65)] ring-1 ring-white/90 sm:px-8 sm:py-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(220,235,209,0.9),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(225,238,249,0.85),transparent_32%)]" />
      <CornerLeaves className="float-slow absolute -right-3 -top-3 h-24 w-24 text-leaf-300" />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.2em] text-leaf-900 shadow-sm ring-1 ring-leaf-100">
            <Thermometer size={16} />
            Live chamber temperature
          </div>

          <div className="mt-5 flex flex-wrap items-end gap-3">
            <p className="font-display text-6xl font-semibold leading-none text-bark-900 sm:text-7xl lg:text-8xl">
              {formatTemperature(tempC)}
              <span className="ml-1 text-2xl font-medium text-bark-900/40 sm:text-3xl">C</span>
            </p>
            {loading && (
              <span className="inline-flex items-center gap-2 rounded-full bg-leaf-50 px-3 py-1.5 text-sm font-semibold text-leaf-900">
                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-leaf-500" />
                Fetching live data
              </span>
            )}
          </div>

          <p className={`mt-4 text-lg font-bold ${TONE_STYLES[status.tone]}`}>
            {status.label}
          </p>
          <p className="mt-2 max-w-xl text-sm leading-6 text-bark-900/60 sm:text-base">
            {statusText}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:w-[23rem]">
          <div className="rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-leaf-100">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-bark-900/45">Target</p>
            <p className="mt-2 font-display text-3xl font-semibold text-bark-900">
              {targetC != null ? `${formatTemperature(targetC)} C` : '--'}
            </p>
          </div>

          <div className="rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-leaf-100">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-bark-900/45">Cooling</p>
            <p className="mt-2 inline-flex items-center gap-2 font-display text-3xl font-semibold text-bark-900">
              <Snowflake size={22} className={coolingOn ? 'text-sky-400 soft-spin' : 'text-bark-900/30'} />
              {coolingOn ? 'ON' : 'OFF'}
            </p>
          </div>

          <div className="rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-leaf-100">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-bark-900/45">Sensor</p>
            <p className="mt-2 inline-flex items-center gap-2 text-base font-bold text-bark-900">
              {!apiEnabled ? (
                <>
                  <Wifi size={18} className="text-bark-900/35" />
                  Standby
                </>
              ) : isOnline ? (
                <>
                  <Wifi size={18} className="text-leaf-700" />
                  Online
                </>
              ) : (
                <>
                  <WifiOff size={18} className="text-clay-500" />
                  Offline
                </>
              )}
            </p>
          </div>

          <div className="rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-leaf-100">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-bark-900/45">Updated</p>
            <p className="mt-2 text-base font-bold text-bark-900">{formatClock(lastSignalAt)}</p>
          </div>
        </div>
      </div>

      <div className="relative mt-6 flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-2 rounded-full bg-leaf-50 px-3 py-1.5 text-sm font-semibold text-leaf-900">
          <span className="h-2.5 w-2.5 rounded-full bg-leaf-500" />
          Smart storage staying on watch
        </span>
        <span className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-sm font-semibold text-bark-900/70 ring-1 ring-leaf-100">
          <TriangleAlert size={16} className={activeAlertCount ? 'text-gold-400' : 'text-leaf-500'} />
          {activeAlertCount ? `${activeAlertCount} active alert${activeAlertCount === 1 ? '' : 's'}` : 'No active alerts'}
        </span>
      </div>
    </div>
  );
}
