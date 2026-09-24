import React from "react";
import { cn } from "../../utils/cn";
import { motion } from "framer-motion";
import type { HTMLMotionProps } from "framer-motion";

export interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  children?: React.ReactNode;
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline";
  size?: "xs" | "sm" | "md" | "lg";
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, children, disabled, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: disabled || loading ? 1 : 1.012 }}
        whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
        disabled={disabled || loading}
        className={cn(
          "relative inline-flex items-center justify-center font-semibold tracking-normal cursor-pointer",
          "transition-all duration-150 focus-visible:outline-none",
          "focus-visible:ring-2 focus-visible:ring-[#9C5B3C] focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-45 select-none",
          {
            // Primary
            "bg-[#9C5B3C] hover:bg-[#854D33] text-white shadow-xs shadow-[#9C5B3C]/20 active:bg-[#6E3F2A] font-bold":
              variant === "primary",
            // Secondary
            "bg-white text-[#221912] border border-[#E6DDCE] hover:bg-[#FAF8F5] hover:border-[#C5B9A8] shadow-2xs font-bold active:bg-[#F6F1E8]":
              variant === "secondary",
            // Outline
            "border border-[#E6DDCE] text-[#8C7E6E] hover:text-[#221912] hover:bg-[#FAF8F5] bg-white shadow-2xs font-bold":
              variant === "outline",
            // Danger
            "bg-rose-600 hover:bg-rose-700 text-white shadow-xs shadow-rose-500/20 active:bg-rose-800 font-bold":
              variant === "danger",
            // Ghost
            "text-[#8C7E6E] hover:text-[#221912] hover:bg-[#F6F1E8] font-bold":
              variant === "ghost",

            // Sizes
            "h-7 px-2.5 text-[11px] rounded-lg gap-1.5":   size === "xs",
            "h-9 px-3.5 text-xs rounded-xl gap-2": size === "sm",
            "h-10 px-4 text-xs rounded-xl gap-2":      size === "md",
            "h-12 px-6 text-sm rounded-xl gap-2.5":  size === "lg",
          },
          className
        )}
        {...props}
      >
        {loading ? (
          <>
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin opacity-80" />
            </span>
            <span className="opacity-0">{children}</span>
          </>
        ) : children}
      </motion.button>
    );
  }
);
Button.displayName = "Button";
