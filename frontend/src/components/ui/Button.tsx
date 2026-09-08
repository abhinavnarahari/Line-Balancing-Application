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
          "focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-45 select-none",
          {
            // Primary
            "bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20 active:bg-blue-800":
              variant === "primary",
            // Secondary
            "bg-white text-slate-700 border border-slate-200/90 hover:bg-slate-50 hover:border-slate-300 shadow-2xs active:bg-slate-100":
              variant === "secondary",
            // Outline
            "border border-slate-200 text-slate-700 hover:bg-slate-50 bg-transparent":
              variant === "outline",
            // Danger
            "bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-500/20 active:bg-rose-800":
              variant === "danger",
            // Ghost
            "text-slate-600 hover:text-slate-900 hover:bg-slate-100":
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
