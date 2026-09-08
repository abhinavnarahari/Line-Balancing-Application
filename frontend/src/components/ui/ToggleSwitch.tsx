
import { motion } from "framer-motion";
import { cn } from "../../utils/cn";

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: "sm" | "md";
  className?: string;
  title?: string;
}

export function ToggleSwitch({
  checked,
  onChange,
  disabled = false,
  size = "sm",
  className,
  title,
}: ToggleSwitchProps) {
  const isSm = size === "sm";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      title={title || (checked ? "Active - Click to pause" : "Inactive - Click to activate")}
      onClick={() => !disabled && onChange(!checked)}
      className={cn(
        "relative inline-flex shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/30",
        isSm ? "h-5 w-9 p-0.5" : "h-6 w-11 p-0.5",
        checked
          ? "bg-[#10B981] shadow-xs"
          : "bg-[#E2E8F0] hover:bg-[#D8C7B5]",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className={cn(
          "pointer-events-none inline-block rounded-full bg-white shadow-md transform transition-transform",
          isSm ? "h-4 w-4" : "h-5 w-5",
          checked ? (isSm ? "translate-x-4" : "translate-x-5") : "translate-x-0"
        )}
      />
    </button>
  );
}

