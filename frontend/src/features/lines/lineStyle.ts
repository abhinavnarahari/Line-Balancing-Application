
/** Style no a line is set up for (its "Active Style"), e.g. "STY-1376"; older free text like "STY-1376 - Sports bra" also works. */
export function lineStyleNo(line?: { currentStyle?: string | null } | null): string {
  return String(line?.currentStyle ?? "").trim().split(/\s+[-–]\s+|\s+/)[0] ?? "";
}

export function lineRunsStyle(line: { currentStyle?: string | null } | null | undefined, styleNo?: string | null): boolean {
  const own = lineStyleNo(line).toLowerCase();
  return !!own && !!styleNo && own === styleNo.trim().toLowerCase();
}
