import { useEffect, useState } from "react";
import { AlertCircle, X } from "lucide-react";
import { isAxiosError } from "axios";
import { getErrorMessage } from "../../lib/api";

const NOTIFY_EVENT = "sewnexa:notify-error";

/** Show an error toast from anywhere (e.g. a catch block that has no inline place to show it). */
export function notifyError(message: string) {
  window.dispatchEvent(new CustomEvent<string>(NOTIFY_EVENT, { detail: message }));
}

/**
 * `.catch(loadFailed([]))` for page loads: keeps the page usable with the fallback value but tells the user
 * the data is incomplete. 404 ("nothing exists yet", e.g. no plan for an order) stays silent.
 */
export function loadFailed<T>(fallback: T) {
  return (err: unknown): T => {
    if (!(isAxiosError(err) && err.response?.status === 404)) {
      notifyError(`Some data could not be loaded: ${getErrorMessage(err)}`);
    }
    return fallback;
  };
}

interface ToastItem {
  id: number;
  message: string;
}

/**
 * Safety net for failed API calls that no screen handled (unhandled promise rejections) plus explicit
 * notifyError() calls. 401s are skipped: the auth layer signs the user out instead.
 */
export function GlobalErrorToaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    let nextId = 1;
    const push = (message: string) => {
      const id = nextId++;
      setToasts((t) => (t.some((x) => x.message === message) ? t : [...t.slice(-2), { id, message }]));
      window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 6000);
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      if (isAxiosError(reason)) {
        if (reason.response?.status === 401 || reason.code === "ERR_CANCELED") return;
        push(getErrorMessage(reason));
        event.preventDefault();
      }
    };
    const onNotify = (event: Event) => push((event as CustomEvent<string>).detail);
    window.addEventListener("unhandledrejection", onRejection);
    window.addEventListener(NOTIFY_EVENT, onNotify);
    return () => {
      window.removeEventListener("unhandledrejection", onRejection);
      window.removeEventListener(NOTIFY_EVENT, onNotify);
    };
  }, []);

  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-4 right-4 z-[10000] flex flex-col gap-2 max-w-sm" aria-live="assertive">
      {toasts.map((t) => (
        <div key={t.id} role="alert"
             className="flex items-start gap-2.5 p-3.5 bg-white border border-rose-200 rounded-2xl shadow-xl text-xs text-rose-800 font-semibold">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span className="flex-1">{t.message}</span>
          <button type="button" aria-label="Dismiss" className="text-rose-400 hover:text-rose-700 cursor-pointer"
                  onClick={() => setToasts((all) => all.filter((x) => x.id !== t.id))}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
