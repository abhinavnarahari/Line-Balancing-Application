/**
 * Formats a date as YYYY-MM-DD in the browser's local timezone.
 *
 * Use this instead of `date.toISOString().split("T")[0]`, which gives the UTC date and is
 * therefore "yesterday" in India between 00:00 and 05:30 IST.
 */
export function toLocalDateString(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
