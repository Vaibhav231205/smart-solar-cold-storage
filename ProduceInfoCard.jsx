import { useEffect, useState } from 'react';
import { Calendar, Check, Crop, LoaderCircle, Package } from 'lucide-react';

const CROP_PRESETS = ['Tomato', 'Potato', 'Onion', 'Apple', 'Grapes', 'Mango'];

export default function ProduceInfoCard({
  produce,
  onSave,
  isLoading = false,
  isSaving = false,
}) {
  const [cropType, setCropType] = useState(produce?.cropType ?? '');
  const [quantity, setQuantity] = useState(produce?.quantity ?? '');
  const [storageDate, setStorageDate] = useState(produce?.storageDate ?? '');

  useEffect(() => {
    setCropType(produce?.cropType ?? '');
    setQuantity(produce?.quantity ?? '');
    setStorageDate(produce?.storageDate ?? '');
  }, [produce]);

  const hasChanges =
    cropType !== (produce?.cropType ?? '') ||
    quantity !== (produce?.quantity ?? '') ||
    storageDate !== (produce?.storageDate ?? '');

  const handleSave = () => {
    if (!hasChanges || isSaving) {
      return;
    }

    void onSave?.({ cropType, quantity, storageDate });
  };

  return (
    <div className="fade-rise rounded-[1.75rem] bg-white p-5 shadow-[0_24px_60px_-45px_rgba(36,50,31,0.7)] ring-1 ring-white/80">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-leaf-700">
          <Crop size={18} />
          <span className="font-display text-xs font-semibold uppercase tracking-[0.18em] text-bark-900/60">
            Stored produce
          </span>
        </div>
        <span className="rounded-full bg-leaf-50 px-2.5 py-1 text-xs font-bold text-leaf-900">
          Optional
        </span>
      </div>

      <p className="mt-2 text-sm text-bark-900/55">
        Track what is inside the chamber for collection-centre records.
      </p>

      <div className="mt-5 space-y-4">
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-bark-900/45">
            Crop type
          </span>
          <div className="relative mt-2">
            <Crop size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-leaf-500" />
            <input
              type="text"
              list="crop-presets"
              value={cropType}
              onChange={(event) => setCropType(event.target.value)}
              placeholder="e.g. Tomato"
              className="w-full rounded-2xl border-0 bg-leaf-50/80 py-3 pl-10 pr-4 text-sm font-semibold text-bark-900 ring-1 ring-leaf-100 transition focus:bg-white focus:ring-leaf-300 focus:outline-none"
            />
            <datalist id="crop-presets">
              {CROP_PRESETS.map((crop) => (
                <option key={crop} value={crop} />
              ))}
            </datalist>
          </div>
        </label>

        <label className="block">
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-bark-900/45">
            Quantity
          </span>
          <div className="relative mt-2">
            <Package size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gold-400" />
            <input
              type="text"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              placeholder="e.g. 120 kg"
              className="w-full rounded-2xl border-0 bg-leaf-50/80 py-3 pl-10 pr-4 text-sm font-semibold text-bark-900 ring-1 ring-leaf-100 transition focus:bg-white focus:ring-leaf-300 focus:outline-none"
            />
          </div>
        </label>

        <label className="block">
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-bark-900/45">
            Storage date
          </span>
          <div className="relative mt-2">
            <Calendar size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sky-400" />
            <input
              type="date"
              value={storageDate}
              onChange={(event) => setStorageDate(event.target.value)}
              className="w-full rounded-2xl border-0 bg-leaf-50/80 py-3 pl-10 pr-4 text-sm font-semibold text-bark-900 ring-1 ring-leaf-100 transition focus:bg-white focus:ring-leaf-300 focus:outline-none"
            />
          </div>
        </label>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={!hasChanges || isSaving || isLoading}
        className="pressable mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-leaf-900 px-4 py-3 text-sm font-bold text-cream shadow-[0_18px_36px_-24px_rgba(36,50,31,0.95)] transition hover:bg-leaf-700 disabled:cursor-not-allowed disabled:bg-leaf-300 disabled:text-bark-900/50"
      >
        {isSaving ? <LoaderCircle size={18} className="animate-spin" /> : <Check size={18} />}
        {isSaving ? 'Saving produce info...' : 'Save produce info'}
      </button>
    </div>
  );
}
