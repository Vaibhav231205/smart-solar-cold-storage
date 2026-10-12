import { LoaderCircle } from 'lucide-react';

export default function LoadingSpinner({ label = 'Loading live data...' }) {
  return (
    <div className="flex items-center justify-center gap-2 rounded-2xl bg-leaf-50/80 px-4 py-5 text-leaf-900">
      <LoaderCircle size={18} className="animate-spin" />
      <span className="text-sm font-semibold">{label}</span>
    </div>
  );
}
