import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronDown, Check, X } from "lucide-react";
import { cn } from "../../utils/cn";

export interface SearchableOption {
  value: string | number;
  label: string;
  sublabel?: string;
  badge?: string;
}

interface SearchableSelectProps {
  value: string | number;
  onChange: (value: string) => void;
  options: SearchableOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = "Select size...",
  disabled = false,
  className,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedOption = useMemo(
    () => options.find((opt) => String(opt.value) === String(value)),
    [options, value]
  );

  const filteredOptions = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.toLowerCase().trim();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.sublabel && opt.sublabel.toLowerCase().includes(q)) ||
        (opt.badge && opt.badge.toLowerCase().includes(q))
    );
  }, [options, query]);

  // Reset highlighted index when query or open state changes
  useEffect(() => {
    setHighlightedIndex(0);
  }, [query, isOpen]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && listRef.current) {
      const items = listRef.current.querySelectorAll("[data-option-index]");
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
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleSelect = (val: string | number) => {
    onChange(String(val));
    setIsOpen(false);
    setQuery("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 10);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredOptions.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredOptions[highlightedIndex]) {
        handleSelect(filteredOptions[highlightedIndex].value);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      setQuery("");
    }
  };

  return (
    <div className={cn("relative w-full", className)} ref={containerRef} onKeyDown={handleKeyDown}>
      {/* Combobox Trigger Field */}
      <div
        onClick={() => {
          if (!disabled) {
            setIsOpen(true);
            setTimeout(() => inputRef.current?.focus(), 10);
          }
        }}
        className={cn(
          "w-full h-10 bg-white border rounded-lg px-3 text-xs text-[#0F172A] flex items-center justify-between transition-all cursor-pointer shadow-2xs",
          isOpen
            ? "border-[#2563EB] ring-2 ring-[#2563EB]/20"
            : "border-[#E2E8F0] hover:border-[#2563EB]/60",
          disabled && "opacity-50 cursor-not-allowed hover:border-[#E2E8F0]"
        )}
      >
        <div className="flex-1 flex items-center gap-2 overflow-hidden mr-2">
          {isOpen ? (
            <div className="flex-1 flex items-center gap-2 w-full">
              <Search className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type to search size..."
                className="w-full bg-transparent text-xs text-[#0F172A] placeholder-[#64748B] focus:outline-none font-medium"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          ) : selectedOption ? (
            <div className="flex items-center gap-2 truncate">
              <span className="font-semibold text-xs text-[#0F172A]">
                {selectedOption.label}
              </span>
              {selectedOption.sublabel && (
                <span className="text-[#64748B] text-xs font-mono font-normal">({selectedOption.sublabel})</span>
              )}
            </div>
          ) : (
            <span className="text-[#64748B] text-xs font-normal">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {selectedOption && !disabled && !isOpen && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
                setQuery("");
              }}
              className="p-1 hover:bg-[#F1F5F9] rounded-md text-[#64748B] hover:text-[#0F172A] transition-colors cursor-pointer"
              title="Clear selection"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          <ChevronDown
            className={cn(
              "w-3.5 h-3.5 text-[#64748B] transition-transform duration-200",
              isOpen && "rotate-180 text-[#2563EB]"
            )}
          />
        </div>
      </div>

      {/* Floating Options Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.99 }}
            transition={{ duration: 0.12 }}
            className="absolute z-[70] w-full min-w-[240px] mt-1 bg-white border border-[#E2E8F0] rounded-xl shadow-xl overflow-hidden flex flex-col max-h-60"
          >
            <div ref={listRef} className="overflow-y-auto p-1.5 space-y-0.5">
              {filteredOptions.length === 0 ? (
                <div className="py-5 text-center text-xs text-[#64748B]">
                  No operations found matching &ldquo;<span className="font-semibold text-[#0F172A]">{query}</span>&rdquo;
                </div>
              ) : (
                filteredOptions.map((opt, idx) => {
                  const isSelected = String(opt.value) === String(value);
                  const isHighlighted = idx === highlightedIndex;

                  return (
                    <div
                      key={opt.value}
                      data-option-index={idx}
                      onClick={() => handleSelect(opt.value)}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      className={cn(
                        "w-full px-3 py-2 text-xs rounded-lg text-left flex items-center justify-between transition-colors cursor-pointer",
                        isSelected
                          ? "bg-[#F8FAFC] text-[#0F172A] font-semibold"
                          : isHighlighted
                          ? "bg-[#F8FAFC] text-[#0F172A]"
                          : "text-[#475569]"
                      )}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-medium text-xs text-[#0F172A]">
                          {opt.label}
                        </span>
                        {opt.sublabel && (
                          <span className="text-[#64748B] text-xs font-mono font-normal">({opt.sublabel})</span>
                        )}
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#2563EB] shrink-0 ml-2" />}
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
