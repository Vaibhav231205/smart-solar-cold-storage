export function toNumber(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function pickObject(payload, keys = ['data']) {
  for (const key of keys) {
    const candidate = payload?.[key];
    if (candidate && typeof candidate === 'object' && !Array.isArray(candidate)) {
      return candidate;
    }
  }

  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    return payload;
  }

  return null;
}

export function pickList(payload, keys = ['items', 'data']) {
  if (Array.isArray(payload)) {
    return payload;
  }

  for (const key of keys) {
    const candidate = payload?.[key];
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return [];
}

export function toTimestampMs(...values) {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Date.parse(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return null;
}

export function pickTimestamp(record, keys = ['timestamp', 'recordedAt', 'createdAt', 'updatedAt']) {
  return toTimestampMs(...keys.map((key) => record?.[key]));
}

export function pickNumber(record, keys) {
  for (const key of keys) {
    const value = toNumber(record?.[key]);
    if (value != null) {
      return value;
    }
  }

  return null;
}

export function formatClock(value) {
  const timestamp = toTimestampMs(value);
  if (timestamp == null) {
    return 'Waiting for signal';
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(timestamp));
}

export function formatDateTime(value) {
  const timestamp = toTimestampMs(value);
  if (timestamp == null) {
    return 'Pending';
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(timestamp));
}

export function average(values) {
  if (!values.length) {
    return null;
  }

  const total = values.reduce((sum, value) => sum + value, 0);
  return total / values.length;
}
