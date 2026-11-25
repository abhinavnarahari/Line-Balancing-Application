import { useEffect, useRef } from "react";

/**
 * Background refresh that is kind to the server and the browser:
 * - runs `poll` every `intervalMs` only while the tab is visible,
 * - refreshes once immediately when the tab becomes visible again,
 * - passes an `isCurrent()` guard so a slow response from an old poll cannot overwrite newer state
 *   (e.g. after the selected date/order changed).
 * The latest `poll` is always used; `deps` restart the schedule (like useEffect deps).
 */
export function usePolling(
  poll: (isCurrent: () => boolean) => void | Promise<void>,
  intervalMs: number,
  deps: unknown[] = [],
) {
  const pollRef = useRef(poll);
  pollRef.current = poll;

  useEffect(() => {
    let generation = 0;
    const run = () => {
      if (document.visibilityState !== "visible") return;
      const mine = ++generation;
      void Promise.resolve(pollRef.current(() => mine === generation)).catch(() => {
        // background refresh: failures are reported by the initial load, not every tick
      });
    };
    const timer = window.setInterval(run, intervalMs);
    const onVisible = () => {
      if (document.visibilityState === "visible") run();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      generation++;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalMs, ...deps]);
}
