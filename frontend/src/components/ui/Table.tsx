import React from "react";
import { cn } from "../../utils/cn";

/* ─── Table Shell ──────────────────────────────────────── */
const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="w-full overflow-x-auto">
      <table
        ref={ref}
        className={cn("w-full caption-bottom text-sm border-collapse", className)}
        {...props}
      />
    </div>
  )
);
Table.displayName = "Table";

/* ─── Header ───────────────────────────────────────────── */
const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <thead
      ref={ref}
      className={cn("bg-[#F8FAFC] border-b-2 border-[#F1F5F9]", className)}
      {...props}
    />
  )
);
TableHeader.displayName = "TableHeader";

/* ─── Body ─────────────────────────────────────────────── */
const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody ref={ref} className={cn("divide-y divide-[#F1F5F9]", className)} {...props} />
  )
);
TableBody.displayName = "TableBody";

/* ─── Animated Row ─────────────────────────────────────── */
interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  index?: number;
}

const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className, index = 0, style, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        "group relative bg-white transition-colors duration-150",
        "hover:bg-slate-50/80",
        "border-b border-[#F1F5F9] last:border-0",
        className
      )}
      style={{
        animationDelay: `${index * 40}ms`,
        ...style,
      }}
      {...props}
    />
  )
);
TableRow.displayName = "TableRow";

/* ─── Header Cell ──────────────────────────────────────── */
const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        "px-3.5 py-3 text-left align-middle",
        "text-[10px] font-bold tracking-[0.12em] uppercase",
        "text-slate-500 select-none whitespace-nowrap",
        "[&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
);
TableHead.displayName = "TableHead";

/* ─── Data Cell ────────────────────────────────────────── */
const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td
      ref={ref}
      className={cn(
        "px-3.5 py-3 align-middle text-[#0F172A]",
        "[&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
);
TableCell.displayName = "TableCell";

/* ─── Footer ───────────────────────────────────────────── */
const TableFooter = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tfoot
      ref={ref}
      className={cn("bg-[[#F8FAFC]] border-t-2 border-[#F1F5F9] text-[#475569]", className)}
      {...props}
    />
  )
);
TableFooter.displayName = "TableFooter";

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableFooter };

