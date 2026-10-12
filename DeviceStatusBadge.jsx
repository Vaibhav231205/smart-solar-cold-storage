import { Wifi, WifiOff } from 'lucide-react';

export default function DeviceStatusBadge({ isOnline, apiEnabled = true }) {
  if (!apiEnabled) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-cream/85 ring-1 ring-white/10">
        <Wifi size={14} />
        ESP32 Standby
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition-colors duration-500 ${
        isOnline
          ? 'bg-leaf-500/20 text-leaf-100 ring-leaf-300/30'
          : 'bg-clay-500/20 text-clay-100 ring-clay-500/30'
      }`}
    >
      {isOnline ? (
        <Wifi size={14} className="pulse-dot" />
      ) : (
        <WifiOff size={14} />
      )}
      ESP32 {isOnline ? 'Online' : 'Offline'}
    </span>
  );
}
