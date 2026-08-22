import React from "react";
import { cn } from "../../utils/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, hint, error, leftIcon, rightIcon, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#475569]"
          >
            {label}
          </label>
        )}
        <div className="relative group">
          {leftIcon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#8C7E6E]">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full h-10 bg-white text-sm text-[#221912]",
              "border border-[#E6DDCE] rounded-sm",
              "px-3.5 py-2",
              "placeholder:text-[#B8A898]",
              "transition-all duration-150",
              "outline-none",
              "focus:border-[#B48259] focus:ring-2 focus:ring-[#B48259]/15 focus:bg-white",
              "hover:border-[#B8A898]",
              "disabled:cursor-not-allowed disabled:opacity-40 disabled:bg-[slate-50]",
              error && "border-red-400 focus:border-red-500 focus:ring-red-500/15",
              leftIcon && "pl-9",
              rightIcon && "pr-9",
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-[#8C7E6E]">
              {rightIcon}
            </div>
          )}
          {/* Focus accent line */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-[#B48259] scale-x-0 group-focus-within:scale-x-100 transition-transform duration-200 origin-left rounded-full" />
        </div>
        {hint && !error && <p className="text-[11px] text-[#8C7E6E]">{hint}</p>}
        {error && <p className="text-[11px] text-red-500 font-medium">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

