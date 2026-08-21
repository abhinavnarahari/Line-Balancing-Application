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
            className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#6E6656]"
          >
            {label}
          </label>
        )}
        <div className="relative group">
          {leftIcon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#8A8270]">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full h-10 bg-white text-sm text-[#26231D]",
              "border border-[#D0C8B4] rounded-sm",
              "px-3.5 py-2",
              "placeholder:text-[#B8A898]",
              "transition-all duration-150",
              "outline-none",
              "focus:border-[#B8763F] focus:ring-2 focus:ring-[#B8763F]/15 focus:bg-white",
              "hover:border-[#B8A898]",
              "disabled:cursor-not-allowed disabled:opacity-40 disabled:bg-[#F6F2E9]",
              error && "border-red-400 focus:border-red-500 focus:ring-red-500/15",
              leftIcon && "pl-9",
              rightIcon && "pr-9",
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-[#8A8270]">
              {rightIcon}
            </div>
          )}
          {/* Focus accent line */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-[#B8763F] scale-x-0 group-focus-within:scale-x-100 transition-transform duration-200 origin-left rounded-full" />
        </div>
        {hint && !error && <p className="text-[11px] text-[#8A8270]">{hint}</p>}
        {error && <p className="text-[11px] text-red-500 font-medium">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";
