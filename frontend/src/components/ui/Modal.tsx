import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "../../utils/cn";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  maxWidth?: string;
  /** Stacking layer; raise it for dialogs that can open on top of other overlays. */
  zIndexClass?: string;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({ isOpen, onClose, title, subtitle, children, className, maxWidth, zIndexClass = "z-[9999]" }: ModalProps) {
  const [mounted, setMounted] = useState(false);
  const titleId = useId();
  const subtitleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  // Accessibility: move focus into the dialog, trap Tab inside it, close on Escape, restore focus afterwards.
  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const focusTimer = window.setTimeout(() => {
      const dialog = dialogRef.current;
      if (!dialog || dialog.contains(document.activeElement)) return;
      const first = dialog.querySelector<HTMLElement>('input:not([disabled]):not([type="hidden"]), select, textarea') ??
        dialog.querySelector<HTMLElement>(FOCUSABLE);
      (first ?? dialog).focus();
    }, 50);
    const onKeyDown = (e: KeyboardEvent) => {
      const dialog = dialogRef.current;
      if (!dialog) return;
      if (e.key === "Escape") {
        e.stopPropagation();
        onCloseRef.current();
      } else if (e.key === "Tab") {
        const items = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
        if (items.length === 0) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [isOpen]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!mounted) return null;

  const content = (
    <AnimatePresence>
      {isOpen && (
        <div className={cn("fixed inset-0 flex items-center justify-center p-3 sm:p-6 overflow-y-auto", zIndexClass)}>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "relative w-full max-h-[92vh] flex flex-col bg-white shadow-2xl rounded-2xl border border-[#E6DDCE] overflow-hidden my-auto",
              maxWidth || className || "max-w-3xl"
            )}
            onClick={e => e.stopPropagation()}
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={subtitle ? subtitleId : undefined}
            tabIndex={-1}
          >
            {/* Modal Header */}
            <div className="px-6 py-4.5 border-b border-[#E2E8F0] bg-white flex items-center justify-between shrink-0">
              <div className="space-y-0.5">
                <h2 id={titleId} className="text-base font-bold text-[#221912]">{title}</h2>
                {subtitle && <p id={subtitleId} className="text-xs font-medium text-[#8C7E6E]">{subtitle}</p>}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-[#8C7E6E] hover:text-[#221912] p-1.5 rounded-xl hover:bg-[#F6F1E8] transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#9C5B3C]"
                title="Close"
                aria-label="Close dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 divide-y divide-[#F1F5F9]">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}
