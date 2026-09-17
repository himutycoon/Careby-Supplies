export function formatCad(amount: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * A bare `YYYY-MM-DD` is a calendar date, not an instant. `new Date()`
 * parses it as UTC midnight, which renders as the previous day everywhere
 * west of Greenwich — a call booked for Wed would show as Tue in Toronto.
 * Anything with a time component is a real instant and is left alone.
 */
function toLocalDate(iso: string): Date {
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.exec(iso.trim());
  if (!dateOnly) return new Date(iso);

  const [year, month, day] = iso.trim().split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(toLocalDate(iso));
}
