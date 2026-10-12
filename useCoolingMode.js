import { startTransition, useCallback, useEffect, useRef, useState } from 'react';
import { setCoolingMode } from '../api/endpoints';

const COOLING_OVERRIDE_KEY = 'harvest-guard-cooling-override';

function readStoredOverride() {
  if (typeof window === 'undefined') {
    return null;
  }

  const stored = window.localStorage.getItem(COOLING_OVERRIDE_KEY);
  if (stored === 'on') return true;
  if (stored === 'off') return false;
  return null;
}

function writeStoredOverride(value) {
  if (typeof window === 'undefined') {
    return;
  }

  if (value == null) {
    window.localStorage.removeItem(COOLING_OVERRIDE_KEY);
    return;
  }

  window.localStorage.setItem(COOLING_OVERRIDE_KEY, value ? 'on' : 'off');
}

export function useCoolingMode(liveCoolingOn) {
  const [override, setOverrideState] = useState(() => readStoredOverride());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const overrideRef = useRef(override);

  const setOverride = useCallback(async (nextOverride) => {
    overrideRef.current = nextOverride;
    writeStoredOverride(nextOverride);
    setOverrideState(nextOverride);
    setSaving(true);
    setError(null);

    try {
      await setCoolingMode(nextOverride == null ? 'auto' : 'manual', nextOverride ?? liveCoolingOn);
    } catch {
      // Keep the local override when the backend is unavailable.
    } finally {
      setSaving(false);
    }
  }, [liveCoolingOn]);

  const clearOverride = useCallback(() => {
    void setOverride(null);
  }, [setOverride]);

  const forceOn = useCallback(() => {
    void setOverride(true);
  }, [setOverride]);

  const forceOff = useCallback(() => {
    void setOverride(false);
  }, [setOverride]);

  useEffect(() => {
    overrideRef.current = override;
  }, [override]);

  const effectiveCoolingOn = override ?? (typeof liveCoolingOn === 'boolean' ? liveCoolingOn : false);

  return {
    override,
    effectiveCoolingOn,
    saving,
    error,
    setOverride,
    clearOverride,
    forceOn,
    forceOff,
  };
}

export { COOLING_OVERRIDE_KEY };
