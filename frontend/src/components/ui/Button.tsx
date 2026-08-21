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
        whileHover={{ scale: disabled || loading ? 1 : 1.015 }}
        whileTap={{ scale: disabled || loading ? 1 : 0.975 }}
        disabled={disabled || loading}
        className={cn(
          "relative inline-flex items-center justify-center font-medium tracking-wide",
          "transition-all duration-150 focus-visible:outline-none",
          "focus-visible:ring-2 focus-visible:ring-[#B8763F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F6F2E9]",
          "disabled:pointer-events-none disabled:opacity-40 select-none",
          {
            // Primary — rich gradient
            "bg-gradient-to-br from-[#C47F45] via-[#B8763F] to-[#9B5A32] text-white shadow-md shadow-[#B8763F]/25 hover:shadow-lg hover:shadow-[#B8763F]/30":
              variant === "primary",
            // Secondary — white with border
            "bg-white text-[#26231D] border border-[#D0C8B4] hover:border-[#B8763F] hover:bg-[#FBF8F0] shadow-sm":
              variant === "secondary",
            // Outline — transparent with border
            "border border-[#B8763F] text-[#B8763F] hover:bg-[#B8763F]/8 bg-transparent":
              variant === "outline",
            // Danger
            "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 hover:border-red-300 shadow-sm":
              variant === "danger",
            // Ghost
            "text-[#6E6656] hover:text-[#26231D] hover:bg-[#EDE8DF]/60":
              variant === "ghost",

            // Sizes
            "h-7 px-3 text-[11px] rounded-sm gap-1":   size === "xs",
            "h-9 px-4 text-xs rounded-sm gap-1.5":     size === "sm",
            "h-11 px-6 text-sm rounded-sm gap-2":      size === "md",
            "h-13 px-8 text-base rounded-sm gap-2.5":  size === "lg",
          },
          className
        )}
        {...props}
      >
        {loading ? (
          <>
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin opacity-60" />
            </span>
            <span className="opacity-0">{children}</span>
          </>
        ) : children}
      </motion.button>
    );
  }
);
Button.displayName = "Button";
