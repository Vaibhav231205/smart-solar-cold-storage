import { Power, RotateCcw, Snowflake } from 'lucide-react';

function describeCoolingState(coolingOn, overrideMode) {
  if (overrideMode != null) {
    return overrideMode ? 'Manual ON override active' : 'Manual OFF override active';
  }

  if (coolingOn == null) {
    return 'Waiting for live cooling status';
  }

  return coolingOn ? 'Following the live controller state' : 'System is resting right now';
}

export default function CoolingStatusCard({
  coolingOn,
  overrideMode = null,
  isSaving = false,
  onOverrideChange,
  onClearOverride,
}) {
  const hasLiveState = typeof coolingOn === 'boolean';
  const isOn = overrideMode ?? (hasLiveState ? coolingOn : false);

  return (
    <div className="fade-rise rounded-[1.75rem] bg-white p-5 shadow-[0_24px_60px_-45px_rgba(36,50,31,0.7)] ring-1 ring-white/80">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className={`flex items-center gap-2 ${isOn ? 'text-sky-400' : 'text-bark-900/45'}`}>
            <Snowflake size={18} className={isOn ? 'soft-spin' : ''} />
            <span className="font-display text-xs font-semibold uppercase tracking-[0.18em] text-bark-900/60">
              Cooling
            </span>
          </div>
          <p className="mt-3 font-display text-4xl font-semibold text-bark-900">
            {isOn ? 'ON' : 'OFF'}
          </p>
        </div>

        <span className={`rounded-full px-3 py-1 text-xs font-bold ${isSaving ? 'bg-gold-100 text-gold-400' : overrideMode != null ? 'bg-gold-100 text-gold-400' : 'bg-leaf-50 text-leaf-900'}`}>
          {isSaving ? 'Saving...' : overrideMode != null ? 'Manual mode' : 'Auto mode'}
        </span>
      </div>

      <p className="mt-2 text-sm leading-6 text-bark-900/60">
        {describeCoolingState(coolingOn, overrideMode)}
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onOverrideChange?.(true)}
          className={`pressable inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold transition ${isOn ? 'bg-sky-400 text-white shadow-[0_18px_35px_-24px_rgba(91,155,209,0.95)]' : 'bg-sky-100 text-sky-400 hover:bg-sky-100/80'}`}
        >
          <Power size={16} />
          ON
        </button>

        <button
          type="button"
          onClick={() => onOverrideChange?.(false)}
          className={`pressable inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold transition ${!isOn ? 'bg-bark-900 text-cream shadow-[0_18px_35px_-24px_rgba(36,50,31,0.95)]' : 'bg-leaf-50 text-bark-900 hover:bg-leaf-100'}`}
        >
          <Power size={16} />
          OFF
        </button>
      </div>

      <button
        type="button"
        onClick={() => onClearOverride?.()}
        disabled={overrideMode == null}
        className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-bark-900/50 transition hover:text-bark-900 disabled:cursor-not-allowed disabled:text-bark-900/30"
      >
        <RotateCcw size={15} />
        Follow live sensor state
      </button>
    </div>
  );
}
