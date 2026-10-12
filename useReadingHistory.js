import { startTransition, useCallback, useEffect, useState } from 'react';
import { getReadingHistory } from '../api/endpoints';
import { isApiEnabled } from '../api/config';
import { pickList, pickNumber, pickTimestamp } from '../utils/data';

function normalizeHistory(payload) {
  const readings = pickList(payload, ['history', 'readings', 'items', 'data']);

  return readings
    .map((entry) => ({
      ...entry,
      timestamp: pickTimestamp(entry),
      tempC: pickNumber(entry, ['tempC', 'temperatureC', 'temperature', 'temp']),
      humidity: pickNumber(entry, ['humidity', 'humidityPercent', 'humidityPct']),
      battery: pickNumber(entry, ['battery', 'batteryPercent', 'batteryLevel']),
      batteryVoltage: pickNumber(entry, [
        'batteryVoltage',
        'batteryV',
        'voltage',
        'battery_voltage',
        'vbat',
      ]),
    }))
    .filter((entry) => entry.timestamp != null)
    .sort((left, right) => left.timestamp - right.timestamp);
}

// Fetches historical readings for the temperature/humidity charts.
export function useReadingHistory(params = {}, pollMs = 30000) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const paramsKey = JSON.stringify(params);

  const fetchHistory = useCallback(async () => {
    if (!isApiEnabled) {
      setLoading(false);
      return;
    }

    try {
      const payload = await getReadingHistory(params);
      if (payload == null) {
        return;
      }
      const nextHistory = normalizeHistory(payload);

      startTransition(() => {
        setHistory(nextHistory);
        setError(null);
      });
    } catch {
      // History stays empty when the backend is unavailable.
    } finally {
      setLoading(false);
    }
  }, [paramsKey]);

  useEffect(() => {
    if (!isApiEnabled) {
      setLoading(false);
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      void fetchHistory();
    }, 0);
    const intervalId = window.setInterval(() => {
      void fetchHistory();
    }, pollMs);

    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
    };
  }, [fetchHistory, pollMs]);

  return { history, loading, error, refetch: fetchHistory };
}
