import { pickNumber, pickTimestamp } from './data';

export function normalizeReading(raw) {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const coolingRaw = raw.coolingOn ?? raw.cooling ?? raw.coolerOn;
  const powerRaw = raw.powerSource ?? raw.power ?? raw.source;

  return {
    ...raw,
    timestamp: pickTimestamp(raw),
    tempC: pickNumber(raw, ['tempC', 'temperatureC', 'temperature', 'temp']),
    humidity: pickNumber(raw, ['humidity', 'humidityPercent', 'humidityPct']),
    battery: pickNumber(raw, ['battery', 'batteryPercent', 'batteryLevel']),
    batteryVoltage: pickNumber(raw, [
      'batteryVoltage',
      'batteryV',
      'voltage',
      'battery_voltage',
      'vbat',
    ]),
    current: pickNumber(raw, ['current', 'currentA', 'amps']),
    power: pickNumber(raw, ['power', 'powerW', 'watts']),
    targetC: pickNumber(raw, ['targetC', 'target', 'targetTemp']),
    coolingOn:
      typeof coolingRaw === 'boolean'
        ? coolingRaw
        : coolingRaw === 1 || coolingRaw === '1' || coolingRaw === 'on'
          ? true
          : coolingRaw === 0 || coolingRaw === '0' || coolingRaw === 'off'
            ? false
            : null,
    powerSource: typeof powerRaw === 'string' ? powerRaw : null,
  };
}

export function describeBatteryVoltage(voltage) {
  if (voltage == null) {
    return { label: 'Voltage unavailable', tone: 'neutral' };
  }

  if (voltage < 11.5) {
    return { label: 'Critical — charge immediately', tone: 'critical' };
  }

  if (voltage < 12.2) {
    return { label: 'Low voltage', tone: 'warn' };
  }

  if (voltage <= 13.8) {
    return { label: 'Healthy range', tone: 'good' };
  }

  return { label: 'Charging / high', tone: 'good' };
}

const VOLTAGE_TONE = {
  good: 'text-leaf-700',
  warn: 'text-gold-400',
  critical: 'text-clay-500',
  neutral: 'text-bark-900/45',
};

export function batteryVoltageTone(voltage) {
  return VOLTAGE_TONE[describeBatteryVoltage(voltage).tone];
}

export function formatVoltage(voltage) {
  if (voltage == null) {
    return '--';
  }

  return `${voltage.toFixed(1)} V`;
}

// Current/power are only present when the device has a safely-rated
// current sensor wired in — many builds won't have this, so both are
// nullable and simply omitted from the UI when absent.
export function formatCurrent(current) {
  if (current == null) {
    return '--';
  }

  return `${current.toFixed(2)} A`;
}

export function formatPower(power) {
  if (power == null) {
    return '--';
  }

  return `${power.toFixed(1)} W`;
}

export function formatPowerSource(source) {
  if (!source) {
    return 'Unknown';
  }

  const normalized = source.toLowerCase();

  if (normalized.includes('solar')) {
    return 'Solar';
  }

  if (normalized.includes('batt')) {
    return 'Battery';
  }

  if (normalized.includes('grid') || normalized.includes('mains')) {
    return 'Grid';
  }

  return source.charAt(0).toUpperCase() + source.slice(1);
}

export function isSolarSource(source) {
  return (source ?? '').toLowerCase().includes('solar');
}
