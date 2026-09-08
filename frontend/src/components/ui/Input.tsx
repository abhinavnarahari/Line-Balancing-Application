import React from "react";
import { cn } from "../../utils/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, hint, helperText, error, leftIcon, rightIcon, id, ...props }, ref) => {
    const displayHint = hint || helperText;
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-[11px] font-bold tracking-wider uppercase text-slate-500"
          >
            {label}
          </label>
        )}
        <div className="relative group">
          {leftIcon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full h-10 bg-white text-xs font-semibold text-slate-800",
              "border border-slate-200/90 rounded-xl",
              "px-3.5 py-2",
              "placeholder:text-slate-400",
              "transition-all duration-150",
              "outline-none",
              "focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 focus:bg-white",
              "hover:border-slate-300",
              "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-50",
              error && "border-rose-400 focus:border-rose-500 focus:ring-rose-500/15",
              leftIcon && "pl-9",
              rightIcon && "pr-9",
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
              {rightIcon}
            </div>
          )}
        </div>
        {displayHint && !error && <p className="text-[11px] text-slate-500">{displayHint}</p>}
        {error && <p className="text-[11px] text-rose-500 font-semibold">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";
