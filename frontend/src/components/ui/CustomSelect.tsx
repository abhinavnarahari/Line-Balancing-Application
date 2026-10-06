import { useState, useRef, useEffect, useMemo, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check, X } from "lucide-react";
import { cn } from "../../utils/cn";

export interface CustomSelectOption {
  value: string | number;
  label: string;
  sublabel?: string;
  badge?: string;
  badgeColor?: string;
  icon?: ReactNode;
  disabled?: boolean;
}

interface CustomSelectProps {
  value: string | number;
  onChange: (value: string) => void;
  options: (CustomSelectOption | string)[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
  clearable?: boolean;
  icon?: ReactNode;
  variant?: "default" | "subtle" | "ghost";
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Select an option...",
  disabled = false,
  className,
  size = "md",
  clearable = false,
  icon,
  variant = "default",
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Normalize options to CustomSelectOption objects
  const normalizedOptions: CustomSelectOption[] = useMemo(() => {
    return options.map((opt) => {
      if (typeof opt === "string") {
        return { value: opt, label: opt };
      }
      return opt;
    });
  }, [options]);

  const selectedOption = useMemo(
    () => normalizedOptions.find((opt) => String(opt.value) === String(value)),
    [normalizedOptions, value]
  );

  // Reset highlighted index when open state changes
  useEffect(() => {
    if (isOpen) {
      const idx = normalizedOptions.findIndex((opt) => String(opt.value) === String(value));
      setHighlightedIndex(idx >= 0 ? idx : 0);
    }
  }, [isOpen, normalizedOptions, value]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && listRef.current) {
      const items = listRef.current.querySelectorAll("[data-select-option-index]");
      if (items[highlightedIndex]) {
        (items[highlightedIndex] as HTMLElement).scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightedIndex, isOpen]);

  // Outside click listener
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleSelect = (val: string | number) => {
    onChange(String(val));
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < normalizedOptions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : normalizedOptions.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const current = normalizedOptions[highlightedIndex];
      if (current && !current.disabled) {
        handleSelect(current.value);
      }
    } else if (e.key === "Escape" || e.key === "Tab") {
      setIsOpen(false);
    }
  };

  const sizeClasses = {
    sm: "h-8 px-2.5 text-xs rounded-lg",
    md: "h-10 px-3 text-xs rounded-xl",
    lg: "h-11 px-3.5 text-xs rounded-2xl",
  };

  const variantClasses = {
    default: cn(
      "bg-white border-[#E6DDCE] text-[#221912]",
      isOpen ? "border-[#9C5B3C] ring-3 ring-[#9C5B3C]/12" : "hover:border-[#B48259]"
    ),
    subtle: cn(
      "bg-[#F6F1E8] border-[#E6DDCE] text-[#221912]",
      isOpen ? "border-[#9C5B3C] bg-white ring-3 ring-[#9C5B3C]/12" : "hover:border-[#B48259] hover:bg-white"
    ),
    ghost: cn(
      "bg-transparent border-transparent text-[#221912]",
      isOpen ? "bg-white border-[#9C5B3C] ring-3 ring-[#9C5B3C]/12" : "hover:bg-[#F6F1E8]"
    ),
  };

  return (
    <div className={cn("relative w-full text-left select-none", className)} ref={containerRef} onKeyDown={handleKeyDown}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        title={selectedOption ? `${selectedOption.label}${selectedOption.sublabel ? ` (${selectedOption.sublabel})` : ""}` : placeholder}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={cn(
          "w-full border flex items-center justify-between gap-2 transition-all font-semibold shadow-2xs cursor-pointer text-left focus:outline-none",
          sizeClasses[size],
          variantClasses[variant],
          disabled && "opacity-50 cursor-not-allowed bg-slate-50 hover:border-[#E6DDCE]"
        )}
      >
        <div className="flex items-center gap-2 truncate flex-1 min-w-0">
          {icon && <span className="text-[#9C5B3C] shrink-0">{icon}</span>}
          {selectedOption ? (
            <div className="flex items-center gap-1.5 truncate">
              {selectedOption.icon && <span className="shrink-0">{selectedOption.icon}</span>}
              <span className="truncate text-[#221912] font-semibold">{selectedOption.label}</span>
              {selectedOption.sublabel && (
                <span className="text-[#8C7E6E] font-normal text-[11px] truncate">({selectedOption.sublabel})</span>
              )}
              {selectedOption.badge && (
                <span
                  className={cn(
                    "text-[10px] font-bold px-1.5 py-0.2 rounded-md shrink-0",
                    selectedOption.badgeColor || "bg-[#F6F1E8] text-[#9C5B3C] border border-[#E6DDCE]"
                  )}
                >
                  {selectedOption.badge}
                </span>
              )}
            </div>
          ) : (
            <span className="text-[#8C7E6E] font-normal truncate">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-1">
          {clearable && selectedOption && !disabled && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              className="p-1 hover:bg-[#F6F1E8] rounded-md text-[#8C7E6E] hover:text-[#9C5B3C] transition-colors cursor-pointer"
              title="Clear selection"
            >
              <X className="w-3 h-3" />
            </span>
          )}
          <ChevronDown
            className={cn(
              "w-4 h-4 text-[#9C5B3C] transition-transform duration-200 shrink-0",
              isOpen && "rotate-180 text-[#B06C49]"
            )}
          />
        </div>
      </button>

      {/* Dropdown Floating Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            className="absolute z-[9999] min-w-full w-max max-w-[min(92vw,560px)] left-0 mt-1.5 bg-white border border-[#E6DDCE] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-72 p-1.5"
            style={{ filter: "drop-shadow(0 12px 24px rgba(34, 25, 18, 0.12))" }}
          >
            <div ref={listRef} className="overflow-y-auto custom-scrollbar space-y-1 p-0.5">
              {normalizedOptions.length === 0 ? (
                <div className="py-4 text-center text-xs text-[#8C7E6E]">No options available</div>
              ) : (
                normalizedOptions.map((opt, idx) => {
                  const isSelected = String(opt.value) === String(value);
                  const isHighlighted = idx === highlightedIndex;

                  return (
                    <div
                      key={String(opt.value) + idx}
                      data-select-option-index={idx}
                      onClick={() => !opt.disabled && handleSelect(opt.value)}
                      onMouseEnter={() => !opt.disabled && setHighlightedIndex(idx)}
                      className={cn(
                        "w-full px-3 py-2 text-xs rounded-xl flex items-center justify-between gap-3 transition-all cursor-pointer select-none",
                        opt.disabled && "opacity-40 cursor-not-allowed",
                        isSelected
                          ? "bg-[#F6F1E8] text-[#9C5B3C] font-bold shadow-2xs"
                          : isHighlighted
                          ? "bg-[#FAF7F2] text-[#221912]"
                          : "text-[#221912] hover:bg-[#FAF7F2]"
                      )}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-1.5 min-w-0">
                          <span className={cn("whitespace-normal text-left", isSelected ? "font-bold text-[#9C5B3C]" : "font-semibold text-[#221912]")}>
                            {opt.label}
                          </span>
                          {opt.sublabel && (
                            <span className="text-[#8C7E6E] text-[11px] font-normal whitespace-normal text-left">
                              ({opt.sublabel})
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                        {opt.badge && (
                          <span
                            className={cn(
                              "text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 whitespace-nowrap",
                              opt.badgeColor || (isSelected ? "bg-white text-[#9C5B3C] border border-[#E6DDCE]" : "bg-[#FAF7F2] text-[#9C5B3C] border border-[#E6DDCE]")
                            )}
                          >
                            {opt.badge}
                          </span>
                        )}
                        {isSelected && <Check className="w-4 h-4 text-[#9C5B3C] shrink-0" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
