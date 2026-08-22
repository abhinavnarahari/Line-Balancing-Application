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
          "transition-colors duration-200 focus-visible:outline-none",
          "focus-visible:ring-2 focus-visible:ring-[#B48259] focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-40 select-none",
          {
            // Primary
            "bg-[#B48259]/10 text-[#B48259] border border-[#B48259] hover:bg-[#B48259]/20 shadow-sm":
              variant === "primary",
            // Secondary
            "bg-white text-[#475569] border border-[#E6DDCE] hover:border-[#C5B9A8] hover:bg-[#FEFCF9] shadow-sm":
              variant === "secondary",
            // Outline
            "border border-[#E6DDCE] text-[#8C7E6E] hover:bg-[#FAFAF8] bg-transparent":
              variant === "outline",
            // Danger
            "bg-[#FDF2F0] text-[#C0462B] border border-[#FDF2F0] hover:border-[#C0462B]/30 shadow-sm":
              variant === "danger",
            // Ghost
            "text-[#475569] hover:text-[#221912] hover:bg-[#FAFAF8]":
              variant === "ghost",

            // Sizes
            "h-7 px-3 text-[11px] rounded-xl gap-1":   size === "xs",
            "h-9 px-3.5 text-[12.5px] rounded-xl gap-2": size === "sm",
            "h-11 px-5 text-sm rounded-xl gap-2":      size === "md",
            "h-13 px-6 text-base rounded-xl gap-2.5":  size === "lg",
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
