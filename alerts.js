import { formatDateTime } from './data';

const HUMIDITY_MAX = 85;
const BATTERY_LOW = 25;

function makeAlert({ id, type, severity, message, timestamp, resolved = false }) {
  return { id, type, severity, message, timestamp, resolved };
}

export function deriveLiveAlerts({
  reading,
  isOnline,
  targetC,
  previousPowerSource,
  wasOnline,
}) {
  const alerts = [];
  const now = reading?.timestamp ?? Date.now();

  if (!isOnline && reading != null) {
    alerts.push(
      makeAlert({
        id: 'live-device-offline',
        type: 'device_disconnected',
        severity: 'critical',
        message: 'ESP32 is offline — no recent sensor data received.',
        timestamp: now,
      }),
    );
  } else if (wasOnline === false && isOnline) {
    alerts.push(
      makeAlert({
        id: 'live-device-reconnected',
        type: 'device_reconnected',
        severity: 'info',
        message: 'ESP32 is back online and sending data.',
        timestamp: now,
      }),
    );
  }

  if (reading?.tempC != null && targetC != null && reading.tempC > targetC + 2) {
    alerts.push(
      makeAlert({
        id: 'live-high-temperature',
        type: 'high_temperature',
        severity: 'warning',
        message: `Chamber temperature ${reading.tempC.toFixed(1)}°C exceeds target by more than 2°C.`,
        timestamp: now,
      }),
    );
  }

  if (reading?.humidity != null && reading.humidity > HUMIDITY_MAX) {
    alerts.push(
      makeAlert({
        id: 'live-unsafe-humidity',
        type: 'unsafe_humidity',
        severity: 'warning',
        message: `Humidity at ${Math.round(reading.humidity)}% — above safe storage limit.`,
        timestamp: now,
      }),
    );
  }

  if (reading?.battery != null && reading.battery < BATTERY_LOW) {
    alerts.push(
      makeAlert({
        id: 'live-low-battery',
        type: 'low_battery',
        severity: 'critical',
        message: `Battery at ${Math.round(reading.battery)}% — charge or switch power source soon.`,
        timestamp: now,
      }),
    );
  }

  const currentSource = reading?.powerSource;
  if (
    previousPowerSource &&
    currentSource &&
    previousPowerSource.toLowerCase() !== currentSource.toLowerCase()
  ) {
    alerts.push(
      makeAlert({
        id: `live-power-change-${now}`,
        type: 'power_source_change',
        severity: 'info',
        message: `Power source changed from ${previousPowerSource} to ${currentSource}.`,
        timestamp: now,
      }),
    );
  }

  return alerts;
}

export function mergeAlerts(backendAlerts = [], liveAlerts = []) {
  const seen = new Set();
  const merged = [];

  for (const alert of [...liveAlerts, ...backendAlerts]) {
    const key = alert.id ?? `${alert.type}-${alert.timestamp}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    merged.push(alert);
  }

  return merged.sort((left, right) => {
    const leftTime = Date.parse(left.timestamp) || 0;
    const rightTime = Date.parse(right.timestamp) || 0;
    return rightTime - leftTime;
  });
}

export function formatAlertType(type) {
  if (!type) {
    return 'System';
  }

  return type
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export { formatDateTime };
