import { useId } from 'react';
import { BatteryFull, Gauge, Sun } from 'lucide-react';
import { LeafSprig } from '../common/LeafDecorations';
import LoadingSpinner from '../common/LoadingSpinner';
import { average, formatClock } from '../../utils/data';

const CHART_WIDTH = 320;
const CHART_HEIGHT = 160;
const CHART_PADDING = 18;

function SummaryStat({ icon: Icon, label, value, tone }) {
  return (
    <div className="rounded-2xl bg-white/85 px-3 py-3 shadow-sm ring-1 ring-leaf-100">
      <div className={`flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.18em] ${tone}`}>
        <Icon size={14} />
        {label}
      </div>
      <p className="mt-2 font-display text-2xl font-semibold text-bark-900">{value}</p>
    </div>
  );
}

export default function BatteryHistoryChart({ history = [], loading = false }) {
  const gradientId = useId();
  const samples = history.filter((entry) => entry.battery != null).slice(-10);
  const barAreaWidth = CHART_WIDTH - CHART_PADDING * 2;
  const barSlot = samples.length ? barAreaWidth / samples.length : 0;
  const barWidth = Math.max(12, barSlot - 8);
  const latest = samples[samples.length - 1];
  const hasData = samples.length > 0;

  return (
    <div className="fade-rise rounded-[1.75rem] bg-white p-5 shadow-[0_24px_60px_-45px_rgba(36,50,31,0.7)] ring-1 ring-white/80">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-display text-lg font-semibold text-bark-900">Battery trend</p>
          <p className="mt-1 text-sm text-bark-900/50">
            Charge history to help spot drain or solar recovery
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <SummaryStat
            icon={BatteryFull}
            label="Average"
            value={samples.length ? `${Math.round(average(samples.map((sample) => sample.battery)))}%` : '--'}
            tone="text-leaf-700"
          />
          <SummaryStat
            icon={Gauge}
            label="Lowest"
            value={samples.length ? `${Math.round(Math.min(...samples.map((sample) => sample.battery)))}%` : '--'}
            tone="text-clay-500"
          />
        </div>
      </div>

      <div className="vine-divider my-4" />

      {loading && !hasData ? (
        <LoadingSpinner label="Loading battery history..." />
      ) : hasData ? (
        <>
          <div className="overflow-hidden rounded-[1.5rem] bg-[linear-gradient(180deg,rgba(238,246,233,0.9),rgba(255,255,255,0.96))] p-4 ring-1 ring-leaf-100">
            <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} className="h-52 w-full" aria-label="Battery history chart">
              <defs>
                <linearGradient id={`${gradientId}-battery`} x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="rgba(124,179,66,1)" />
                  <stop offset="100%" stopColor="rgba(76,140,59,0.72)" />
                </linearGradient>
              </defs>

              {[0, 1, 2, 3].map((lineIndex) => {
                const y = CHART_PADDING + ((CHART_HEIGHT - CHART_PADDING * 2) / 3) * lineIndex;
                return (
                  <line
                    key={lineIndex}
                    x1={CHART_PADDING}
                    x2={CHART_WIDTH - CHART_PADDING}
                    y1={y}
                    y2={y}
                    stroke="rgba(46,94,62,0.08)"
                    strokeWidth="1"
                  />
                );
              })}

              {samples.map((sample, index) => {
                const height = ((sample.battery ?? 0) / 100) * (CHART_HEIGHT - CHART_PADDING * 2);
                const x = CHART_PADDING + barSlot * index + (barSlot - barWidth) / 2;
                const y = CHART_HEIGHT - CHART_PADDING - height;

                return (
                  <rect
                    key={`${sample.timestamp}-${index}`}
                    x={x}
                    y={y}
                    width={barWidth}
                    height={height}
                    rx="10"
                    fill={`url(#${gradientId}-battery)`}
                    className="bar-rise"
                    style={{ animationDelay: `${index * 70}ms` }}
                  />
                );
              })}
            </svg>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-bark-900/40">
              <span>{samples[0] ? formatClock(samples[0].timestamp) : '--'}</span>
              <span>{latest ? formatClock(latest.timestamp) : '--'}</span>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <SummaryStat
              icon={BatteryFull}
              label="Latest"
              value={latest?.battery != null ? `${Math.round(latest.battery)}%` : '--'}
              tone="text-leaf-700"
            />
            <SummaryStat
              icon={Sun}
              label="Healthy samples"
              value={`${samples.filter((sample) => sample.battery >= 50).length}`}
              tone="text-gold-400"
            />
            <SummaryStat
              icon={Gauge}
              label="Samples"
              value={String(samples.length)}
              tone="text-sky-400"
            />
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-[1.5rem] bg-leaf-50/70 py-10 text-center text-bark-900/40 ring-1 ring-leaf-100">
          <LeafSprig className="h-10 w-16 text-leaf-300" flip />
          <p className="text-sm">Battery history will appear after a few readings are saved.</p>
        </div>
      )}
    </div>
  );
}
