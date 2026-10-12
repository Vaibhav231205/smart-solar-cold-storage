import { startTransition, useCallback, useEffect, useState } from 'react';
import { getAlerts } from '../api/endpoints';
import { isApiEnabled } from '../api/config';
import { pickList, pickTimestamp } from '../utils/data';

function sortAlerts(alerts) {
  return [...alerts].sort((left, right) => {
    const leftTime = pickTimestamp(left) ?? 0;
    const rightTime = pickTimestamp(right) ?? 0;
    return rightTime - leftTime;
  });
}

// Polls /api/alerts so alert banners/history stay current.
export function useAlerts(pollMs = 10000) {
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = useCallback(async () => {
    if (!isApiEnabled) {
      setLoading(false);
      return;
    }

    try {
      const payload = await getAlerts();
      if (payload == null) {
        return;
      }
      const nextAlerts = sortAlerts(pickList(payload, ['alerts', 'items', 'data']));

      startTransition(() => {
        setAlerts(nextAlerts);
        setError(null);
      });
    } catch {
      // Alerts stay empty when the backend is unavailable.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isApiEnabled) {
      setLoading(false);
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      void fetchAlerts();
    }, 0);
    const intervalId = window.setInterval(() => {
      void fetchAlerts();
    }, pollMs);

    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
    };
  }, [fetchAlerts, pollMs]);

  const activeAlerts = alerts.filter((a) => !a.resolved);

  return { alerts, activeAlerts, error, loading, refetch: fetchAlerts };
}
