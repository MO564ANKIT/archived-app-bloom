export function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function dateKeyOf(isoTimestamp: string): string {
  return dateKey(new Date(isoTimestamp));
}

export function parseDateKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function shiftDateKey(key: string, days: number): string {
  const date = parseDateKey(key);
  date.setDate(date.getDate() + days);
  return dateKey(date);
}

export function startOfWeekKey(key: string): string {
  const date = parseDateKey(key);
  const daysSinceMonday = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - daysSinceMonday);
  return dateKey(date);
}

export function monthKeyOf(key: string): string {
  return key.slice(0, 7);
}

export function daysLeftInMonth(key: string): number {
  const date = parseDateKey(key);
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  return lastDay - date.getDate() + 1;
}

export function formatDayLabel(key: string): string {
  return parseDateKey(key).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

/** Whole days from one date key (YYYY-MM-DD) to another; negative when the target is in the past. */
export function daysBetweenKeys(fromKey: string, toKey: string): number {
  return Math.round((parseDateKey(toKey).getTime() - parseDateKey(fromKey).getTime()) / 86_400_000);
}
