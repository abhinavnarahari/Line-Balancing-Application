import { useEffect } from "react";
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
}

export function Modal({ isOpen, onClose, title, subtitle, children, className }: ModalProps) {
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

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "relative w-full max-h-[90vh] flex flex-col bg-white shadow-2xl rounded-2xl overflow-hidden",
              className || "max-w-3xl"
            )}
          >
            <div className="px-6 py-5 border-b border-[#E6DDCE] bg-white flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-[14px] font-bold text-[#221912]">{title}</h2>
                {subtitle && <p className="text-[12px] font-medium text-[#8C7E6E] mt-0.5">{subtitle}</p>}
              </div>
              <button 
                onClick={onClose} 
                className="text-[#8C7E6E] hover:text-[#221912] transition-colors p-1 rounded-sm focus:outline-none focus:ring-2 focus:ring-[#B48259]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto divide-y divide-[#F0EAE0]">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
