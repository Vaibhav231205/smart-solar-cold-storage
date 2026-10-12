import { useEffect, useState } from 'react';
import { Check, Leaf, LoaderCircle, Minus, Plus } from 'lucide-react';
import { clamp } from '../../utils/data';

const PRESET_TARGETS = [2, 4, 6, 8];

export default function TargetTemperatureControl({
  targetC,
  onChange,
  isLoading = false,
  isSaving = false,
}) {
  const [value, setValue] = useState(targetC ?? 6);

  useEffect(() => {
    if (targetC != null) {
      setValue(targetC);
    }
  }, [targetC]);

  const adjust = (delta) => {
    setValue((currentValue) => clamp(currentValue + delta, 0, 15));
  };

  const hasLiveTarget = targetC != null;
  const canApply = !isLoading && !isSaving && (!hasLiveTarget || value !== targetC);

  return (
    <div className="fade-rise rounded-[1.75rem] bg-[linear-gradient(180deg,rgba(238,246,233,0.95),rgba(255,255,255,0.98))] p-5 shadow-[0_24px_60px_-45px_rgba(36,50,31,0.7)] ring-1 ring-white/80">
      <div className="flex items-center gap-2 text-leaf-900">
        <Leaf size={16} />
        <p className="font-display text-sm font-semibold uppercase tracking-[0.18em]">
          Target control
        </p>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div>
          <p className="font-display text-4xl font-semibold text-bark-900 sm:text-5xl">
            {value}
            <span className="ml-1 text-base font-medium text-bark-900/40">C</span>
          </p>
          <p className="mt-1 text-sm text-bark-900/55">
            {hasLiveTarget ? `Current target ${targetC} C` : 'Set a target for the chamber'}
          </p>
        </div>

        <span className={`rounded-full px-3 py-1 text-xs font-bold ${isSaving ? 'bg-gold-100 text-gold-400' : 'bg-white text-leaf-900 shadow-sm ring-1 ring-leaf-100'}`}>
          {isSaving ? 'Saving...' : isLoading ? 'Loading...' : 'Ready'}
        </span>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <button
          type="button"
          aria-label="Lower target temperature"
          onClick={() => adjust(-1)}
          className="pressable flex h-12 w-12 items-center justify-center rounded-full bg-white text-leaf-900 shadow-sm ring-1 ring-leaf-100 transition hover:bg-leaf-50 active:scale-95"
        >
          <Minus size={20} />
        </button>

        <div className="grid flex-1 grid-cols-4 gap-2 px-1">
          {PRESET_TARGETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setValue(preset)}
              className={`rounded-2xl px-2 py-2 text-sm font-bold transition ${value === preset ? 'bg-leaf-900 text-cream shadow-[0_16px_30px_-20px_rgba(36,50,31,0.95)]' : 'bg-white text-bark-900/65 ring-1 ring-leaf-100 hover:bg-leaf-50'}`}
            >
              {preset}C
            </button>
          ))}
        </div>

        <button
          type="button"
          aria-label="Raise target temperature"
          onClick={() => adjust(1)}
          className="pressable flex h-12 w-12 items-center justify-center rounded-full bg-white text-leaf-900 shadow-sm ring-1 ring-leaf-100 transition hover:bg-leaf-50 active:scale-95"
        >
          <Plus size={20} />
        </button>
      </div>

      <button
        type="button"
        onClick={() => {
          if (canApply) {
            void onChange?.(value);
          }
        }}
        disabled={!canApply}
        className="pressable mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-leaf-900 px-4 py-3 text-sm font-bold text-cream shadow-[0_18px_36px_-24px_rgba(36,50,31,0.95)] transition hover:bg-leaf-700 disabled:cursor-not-allowed disabled:bg-leaf-300 disabled:text-bark-900/50"
      >
        {isSaving ? <LoaderCircle size={18} className="animate-spin" /> : <Check size={18} />}
        {isSaving ? 'Saving target...' : 'Apply temperature'}
      </button>

      <p className="mt-3 text-center text-xs leading-5 text-bark-900/50">
        Use the presets for quick changes, or step up and down one degree at a time.
      </p>
    </div>
  );
}
