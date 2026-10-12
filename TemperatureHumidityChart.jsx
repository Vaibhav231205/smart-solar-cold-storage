import { useId } from 'react';
import { Droplets, Thermometer, TrendingUp } from 'lucide-react';
import { LeafSprig } from '../common/LeafDecorations';
import LoadingSpinner from '../common/LoadingSpinner';
import { average, formatClock } from '../../utils/data';

const CHART_WIDTH = 360;
const CHART_HEIGHT = 180;
const CHART_PADDING = 18;

function createRange(values, padding) {
  if (!values.length) {
    return { min: 0, max: 1 };
  }

  const min = Math.min(...values);
  const max = Math.max(...values);

  if (min === max) {
    return { min: min - padding, max: max + padding };
  }

  return { min: min - padding, max: max + padding };
}

function toY(value, range) {
  const usableHeight = CHART_HEIGHT - CHART_PADDING * 2;
  const span = range.max - range.min || 1;
  const ratio = (value - range.min) / span;
  return CHART_HEIGHT - CHART_PADDING - ratio * usableHeight;
}

function createPoints(samples, valueKey, range) {
  const usableWidth = CHART_WIDTH - CHART_PADDING * 2;
  const step = samples.length > 1 ? usableWidth / (samples.length - 1) : 0;

  return samples
    .map((sample, index) => {
      if (sample[valueKey] == null) {
        return null;
      }

      return {
        x: CHART_PADDING + step * index,
        y: toY(sample[valueKey], range),
      };
    })
    .filter(Boolean);
}

function buildLine(points) {
  if (!points.length) {
    return '';
  }

  return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
}

function buildArea(points) {
  if (!points.length) {
    return '';
  }

  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];
  const bottom = CHART_HEIGHT - CHART_PADDING;
  const line = buildLine(points);

  return `${line} L ${lastPoint.x} ${bottom} L ${firstPoint.x} ${bottom} Z`;
}

function SummaryStat({ tone, icon: Icon, label, value }) {
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

export default function TemperatureHumidityChart({ history = [], loading = false }) {
  const gradientId = useId();
  const samples = history.slice(-14);
  const tempValues = samples.map((sample) => sample.tempC).filter((value) => value != null);
  const humidityValues = samples.map((sample) => sample.humidity).filter((value) => value != null);
  const tempRange = createRange(tempValues, 1.5);
  const humidityRange = createRange(humidityValues, 6);
  const tempPoints = createPoints(samples, 'tempC', tempRange);
  const humidityPoints = createPoints(samples, 'humidity', humidityRange);
  const latestSample = samples[samples.length - 1];
  const midpoint = samples[Math.floor((samples.length - 1) / 2)];
  const hasData = tempPoints.length || humidityPoints.length;

  return (
    <div className="fade-rise rounded-[1.75rem] bg-white p-5 shadow-[0_24px_60px_-45px_rgba(36,50,31,0.7)] ring-1 ring-white/80">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-display text-lg font-semibold text-bark-900">Climate trend</p>
          <p className="mt-1 text-sm text-bark-900/50">
            Recent temperature and humidity movement inside the chamber
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <SummaryStat
            tone="text-leaf-700"
            icon={Thermometer}
            label="Avg temp"
            value={tempValues.length ? `${average(tempValues).toFixed(1)} C` : '--'}
          />
          <SummaryStat
            tone="text-sky-400"
            icon={Droplets}
            label="Avg humidity"
            value={humidityValues.length ? `${Math.round(average(humidityValues))}%` : '--'}
          />
        </div>
      </div>

      <div className="vine-divider my-4" />

      {loading && !hasData ? (
        <LoadingSpinner label="Loading climate history..." />
      ) : hasData ? (
        <>
          <div className="overflow-hidden rounded-[1.5rem] bg-[linear-gradient(180deg,rgba(238,246,233,0.9),rgba(255,255,255,0.96))] p-4 ring-1 ring-leaf-100">
            <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} className="h-56 w-full" aria-label="Temperature and humidity history chart">
              <defs>
                <linearGradient id={`${gradientId}-temp`} x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="rgba(76,140,59,0.28)" />
                  <stop offset="100%" stopColor="rgba(76,140,59,0)" />
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

              {tempPoints.length > 1 && (
                <path
                  d={buildArea(tempPoints)}
                  fill={`url(#${gradientId}-temp)`}
                  className="area-fade"
                />
              )}

              {tempPoints.length > 1 && (
                <path
                  d={buildLine(tempPoints)}
                  fill="none"
                  stroke="rgba(76,140,59,1)"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3"
                  pathLength="100"
                  className="line-draw"
                />
              )}

              {humidityPoints.length > 1 && (
                <path
                  d={buildLine(humidityPoints)}
                  fill="none"
                  stroke="rgba(91,155,209,1)"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3"
                  pathLength="100"
                  className="line-draw stagger-1"
                />
              )}

              {tempPoints.at(-1) && (
                <circle
                  cx={tempPoints.at(-1).x}
                  cy={tempPoints.at(-1).y}
                  r="4.5"
                  fill="rgba(76,140,59,1)"
                  className="area-fade"
                />
              )}

              {humidityPoints.at(-1) && (
                <circle
                  cx={humidityPoints.at(-1).x}
                  cy={humidityPoints.at(-1).y}
                  r="4.5"
                  fill="rgba(91,155,209,1)"
                  className="area-fade"
                />
              )}
            </svg>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-bark-900/40">
              <span>{samples[0] ? formatClock(samples[0].timestamp) : '--'}</span>
              <span>{midpoint ? formatClock(midpoint.timestamp) : '--'}</span>
              <span>{latestSample ? formatClock(latestSample.timestamp) : '--'}</span>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <SummaryStat
              tone="text-leaf-700"
              icon={Thermometer}
              label="Latest temp"
              value={latestSample?.tempC != null ? `${latestSample.tempC.toFixed(1)} C` : '--'}
            />
            <SummaryStat
              tone="text-sky-400"
              icon={Droplets}
              label="Latest humidity"
              value={latestSample?.humidity != null ? `${Math.round(latestSample.humidity)}%` : '--'}
            />
            <SummaryStat
              tone="text-gold-400"
              icon={TrendingUp}
              label="Samples"
              value={String(samples.length)}
            />
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-[1.5rem] bg-leaf-50/70 py-10 text-center text-bark-900/40 ring-1 ring-leaf-100">
          <LeafSprig className="h-10 w-16 text-leaf-300" />
          <p className="text-sm">History will appear here once readings start coming in.</p>
        </div>
      )}
    </div>
  );
}
