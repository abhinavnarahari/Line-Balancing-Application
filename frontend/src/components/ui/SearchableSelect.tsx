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
          "w-full h-10 bg-white border rounded-xl px-3 text-xs text-[#221912] flex items-center justify-between transition-all cursor-pointer shadow-2xs",
          isOpen
            ? "border-[#9C5B3C] ring-2 ring-[#9C5B3C]/15"
            : "border-[#E6DDCE] hover:border-[#B48259]",
          disabled && "opacity-50 cursor-not-allowed hover:border-[#E6DDCE]"
        )}
      >
        <div className="flex-1 flex items-center gap-2 overflow-hidden mr-2">
          {isOpen ? (
            <div className="flex-1 flex items-center gap-2 w-full">
              <Search className="w-3.5 h-3.5 text-[#9C5B3C] shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type to search size..."
                className="w-full bg-transparent text-xs text-[#221912] placeholder-[#8C7E6E] focus:outline-none font-medium"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          ) : selectedOption ? (
            <div className="flex items-center gap-2 truncate">
              <span className="font-semibold text-xs text-[#221912]">
                {selectedOption.label}
              </span>
              {selectedOption.sublabel && (
                <span className="text-[#8C7E6E] text-xs font-mono font-normal">({selectedOption.sublabel})</span>
              )}
            </div>
          ) : (
            <span className="text-[#8C7E6E] text-xs font-normal">{placeholder}</span>
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
              className="p-1 hover:bg-[#F6F1E8] rounded-md text-[#8C7E6E] hover:text-[#9C5B3C] transition-colors cursor-pointer"
              title="Clear selection"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          <ChevronDown
            className={cn(
              "w-4 h-4 text-[#9C5B3C] transition-transform duration-200",
              isOpen && "rotate-180 text-[#B06C49]"
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
            className="absolute z-[70] min-w-full w-max max-w-[min(92vw,560px)] left-0 mt-1.5 bg-white border border-[#E6DDCE] rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-60"
          >
            <div ref={listRef} className="overflow-y-auto custom-scrollbar p-1.5 space-y-0.5">
              {filteredOptions.length === 0 ? (
                <div className="py-5 text-center text-xs text-[#8C7E6E]">
                  No options found matching &ldquo;<span className="font-semibold text-[#221912]">{query}</span>&rdquo;
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
                        "w-full px-3 py-2 text-xs rounded-xl text-left flex items-center justify-between gap-3 transition-colors cursor-pointer",
                        isSelected
                          ? "bg-[#F6F1E8] text-[#9C5B3C] font-bold"
                          : isHighlighted
                          ? "bg-[#FAF7F2] text-[#221912]"
                          : "text-[#221912] hover:bg-[#FAF7F2]"
                      )}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="font-medium text-xs text-[#221912] whitespace-normal">
                          {opt.label}
                        </span>
                        {opt.sublabel && (
                          <span className="text-[#8C7E6E] text-xs font-mono font-normal whitespace-normal">({opt.sublabel})</span>
                        )}
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#9C5B3C] shrink-0 ml-2" />}
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
