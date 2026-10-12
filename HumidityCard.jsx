import { Droplets, Waves } from 'lucide-react';
import { clamp } from '../../utils/data';

function describeHumidity(humidity) {
  if (humidity == null) {
    return 'Waiting for humidity data';
  }

  if (humidity < 60) {
    return 'A little dry';
  }

  if (humidity <= 85) {
    return 'Balanced';
  }

  return 'Very humid';
}

export default function HumidityCard({ humidity }) {
  const humidityLevel = humidity != null ? clamp(humidity, 0, 100) : 0;
  const unsafe = humidity != null && humidity > 85;

  return (
    <div className="fade-rise rounded-[1.75rem] bg-white p-5 shadow-[0_24px_60px_-45px_rgba(36,50,31,0.7)] ring-1 ring-white/80">
      <div className="flex items-center justify-between gap-3">
        <div className={`flex items-center gap-2 ${unsafe ? 'text-gold-400' : 'text-sky-400'}`}>
          <Droplets size={18} />
          <span className="font-display text-xs font-semibold uppercase tracking-[0.18em] text-bark-900/60">
            Humidity
          </span>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${unsafe ? 'bg-gold-100 text-gold-400' : 'bg-sky-100 text-sky-400'}`}>
          {humidity != null ? `${humidityLevel}%` : 'No data'}
        </span>
      </div>

      <p className="value-pop mt-4 font-display text-4xl font-semibold text-bark-900">
        {humidity != null ? `${humidityLevel}%` : '--'}
      </p>
      <p className="mt-1 text-sm font-semibold text-bark-900/55">{describeHumidity(humidity)}</p>

      <div className="mt-5 overflow-hidden rounded-full bg-sky-100">
        <div
          className={`h-3 rounded-full transition-[width] duration-700 ease-out ${unsafe ? 'bg-[linear-gradient(90deg,rgba(227,160,59,0.75),rgba(227,160,59,1))]' : 'bg-[linear-gradient(90deg,rgba(91,155,209,0.7),rgba(91,155,209,1))]'}`}
          style={{ width: `${humidityLevel}%` }}
        />
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-bark-900/40">
        <Waves size={14} />
        Moisture balance in the chamber
      </div>
    </div>
  );
}
