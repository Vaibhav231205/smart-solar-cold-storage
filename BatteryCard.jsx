import { BatteryFull, BatteryLow, Gauge, PlugZap, Sun, Zap } from 'lucide-react';
import { clamp } from '../../utils/data';
import {
  batteryVoltageTone,
  describeBatteryVoltage,
  formatCurrent,
  formatPower,
  formatPowerSource,
  formatVoltage,
  isSolarSource,
} from '../../utils/readings';

function describeBattery(level) {
  if (level == null) {
    return 'Waiting for battery data';
  }

  if (level < 25) {
    return 'Battery is getting low';
  }

  if (level < 60) {
    return 'Battery is holding steady';
  }

  return 'Battery is in a healthy range';
}

export default function BatteryCard({ battery, batteryVoltage, powerSource, current, power }) {
  const level = battery != null ? clamp(battery, 0, 100) : 0;
  const low = battery != null && battery < 25;
  const isSolar = isSolarSource(powerSource);
  const voltageInfo = describeBatteryVoltage(batteryVoltage);
  const hasPowerMonitoring = current != null || power != null;

  return (
    <div className="fade-rise rounded-[1.75rem] bg-white p-5 shadow-[0_24px_60px_-45px_rgba(36,50,31,0.7)] ring-1 ring-white/80">
      <div className={`flex items-center justify-between gap-3 ${low ? 'text-clay-500' : 'text-leaf-700'}`}>
        <div className="flex items-center gap-2">
          {low ? <BatteryLow size={18} /> : <BatteryFull size={18} />}
          <span className="font-display text-xs font-semibold uppercase tracking-[0.18em] text-bark-900/60">
            Battery
          </span>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${low ? 'bg-clay-100 text-clay-500' : 'bg-leaf-50 text-leaf-900'}`}>
          {battery != null ? `${level}%` : 'No data'}
        </span>
      </div>

      <p className="value-pop mt-4 font-display text-4xl font-semibold text-bark-900">
        {battery != null ? `${level}%` : '--'}
      </p>
      <p className="mt-1 text-sm font-semibold text-bark-900/55">{describeBattery(battery)}</p>

      <div className="mt-5 overflow-hidden rounded-full bg-leaf-100">
        <div
          className={`h-3 rounded-full transition-[width] duration-700 ease-out ${low ? 'bg-[linear-gradient(90deg,rgba(217,88,79,0.75),rgba(217,88,79,1))]' : 'bg-[linear-gradient(90deg,rgba(76,140,59,0.75),rgba(76,140,59,1))]'}`}
          style={{ width: `${level}%` }}
        />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-leaf-50/70 px-3 py-3 ring-1 ring-leaf-100">
          <p className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-bark-900/40">
            <Zap size={13} />
            Voltage
          </p>
          <p className={`mt-1 font-display text-xl font-semibold ${batteryVoltageTone(batteryVoltage)}`}>
            {formatVoltage(batteryVoltage)}
          </p>
          <p className="mt-0.5 text-xs font-semibold text-bark-900/45">{voltageInfo.label}</p>
        </div>

        <div className="rounded-2xl bg-leaf-50/70 px-3 py-3 ring-1 ring-leaf-100">
          <p className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-bark-900/40">
            {isSolar ? <Sun size={13} className="text-gold-400" /> : <PlugZap size={13} className="text-sky-400" />}
            Power source
          </p>
          <p className="mt-1 font-display text-xl font-semibold text-bark-900">
            {powerSource ? formatPowerSource(powerSource) : '--'}
          </p>
          <p className="mt-0.5 text-xs font-semibold text-bark-900/45">
            {isSolar ? 'Running on solar' : powerSource ? 'Running on battery/grid' : 'Source unavailable'}
          </p>
        </div>
      </div>

      {hasPowerMonitoring && (
        <div className="mt-3 rounded-2xl bg-leaf-50/70 px-3 py-3 ring-1 ring-leaf-100">
          <p className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-bark-900/40">
            <Gauge size={13} />
            Solar charging current
          </p>
          <div className="mt-1 flex items-baseline gap-4">
            <span className="font-display text-xl font-semibold text-bark-900">{formatCurrent(current)}</span>
            <span className="font-display text-xl font-semibold text-bark-900">{formatPower(power)}</span>
          </div>
          <p className="mt-0.5 text-xs font-semibold text-bark-900/45">
            Measured on the solar input only — not the full system draw
          </p>
        </div>
      )}
    </div>
  );
}
