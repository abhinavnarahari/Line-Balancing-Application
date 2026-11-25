import { useCallback, useRef, useState } from "react";
import { getErrorMessage } from "../lib/api";

/**
 * Form submit helper: blocks double submission while a save is in flight, exposes `saving` for the
 * submit button, and captures the server's error message so the form can stay open and show it.
 */
export function useSubmitGuard() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  const run = useCallback(async (fn: () => void | Promise<void>) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setSaving(true);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      inFlight.current = false;
      setSaving(false);
    }
  }, []);

  return { saving, error, run };
}
