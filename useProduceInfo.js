import { startTransition, useCallback, useEffect, useState } from 'react';
import { getProduceInfo, setProduceInfo } from '../api/endpoints';
import { isApiEnabled } from '../api/config';
import { pickObject, toTimestampMs } from '../utils/data';

const STORAGE_KEY = 'harvest-guard-produce';

const DEFAULT_PRODUCE = {
  cropType: '',
  quantity: '',
  storageDate: '',
};

function readLocalProduce() {
  if (typeof window === 'undefined') {
    return DEFAULT_PRODUCE;
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? { ...DEFAULT_PRODUCE, ...JSON.parse(stored) } : DEFAULT_PRODUCE;
  } catch {
    return DEFAULT_PRODUCE;
  }
}

function writeLocalProduce(produce) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(produce));
}

function normalizeProduce(payload) {
  const raw = pickObject(payload, ['produce', 'data']) ?? payload ?? {};
  const storageDate = raw.storageDate ?? raw.storedAt ?? raw.date ?? '';

  return {
    cropType: raw.cropType ?? raw.crop ?? raw.produceType ?? '',
    quantity: raw.quantity ?? raw.qty ?? raw.amount ?? '',
    storageDate: storageDate
      ? new Date(toTimestampMs(storageDate) ?? storageDate).toISOString().slice(0, 10)
      : '',
  };
}

export function useProduceInfo() {
  const [produce, setProduce] = useState(() => readLocalProduce());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [fromBackend, setFromBackend] = useState(false);

  const refresh = useCallback(async () => {
    if (!isApiEnabled) {
      setLoading(false);
      return;
    }

    try {
      const payload = await getProduceInfo();
      if (payload == null) {
        return;
      }
      const next = normalizeProduce(payload);

      startTransition(() => {
        setProduce(next);
        writeLocalProduce(next);
        setFromBackend(true);
        setError(null);
      });
    } catch {
      startTransition(() => {
        setFromBackend(false);
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const save = useCallback(async (nextProduce) => {
    setSaving(true);
    setError(null);

    startTransition(() => {
      setProduce(nextProduce);
      writeLocalProduce(nextProduce);
    });

    try {
      const payload = await setProduceInfo(nextProduce);
      if (payload == null && !isApiEnabled) {
        return;
      }

      const confirmed = normalizeProduce(payload);

      startTransition(() => {
        setProduce(confirmed);
        writeLocalProduce(confirmed);
        setFromBackend(true);
      });
    } catch {
      // Produce info is already saved locally.
    } finally {
      setSaving(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void refresh();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [refresh]);

  return { produce, loading, saving, error, fromBackend, refresh, save };
}
