import { formatDateISO } from './date';

export { formatDateISO };

/**
 * Parses a "YYYY-MM-DD" string into a Date object (in local time).
 * Returns null if invalid or falsy.
 */
export function getDateFromValue(value) {
  if (!value || typeof value !== 'string') return null;
  const parts = value.split('-');
  if (parts.length !== 3) return null;
  const year = Number(parts[0]);
  const month = Number(parts[1]) - 1;
  const day = Number(parts[2]);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  const date = new Date(year, month, day);
  if (isNaN(date.getTime())) return null;
  return date;
}

/**
 * Formats a "YYYY-MM-DD" value string into a human-readable display date.
 * Example: "2026-07-28" -> "Tue, Jul 28, 2026"
 */
export function formatDateDisplay(value) {
  const date = getDateFromValue(value);
  if (!date) return '';
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Formats a Date object into "Month Year" for header display.
 * Example: Date(2026, 6, 28) -> "July 2026"
 */
export function formatMonthYear(date) {
  if (!date || isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
}

/**
 * Generates array of 42 day objects for a 6-row calendar grid view.
 */
export function getCalendarDays(viewDate) {
  if (!viewDate || isNaN(viewDate.getTime())) return [];
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const startDay = firstDayOfMonth.getDay(); // 0 = Sunday
  const totalDays = lastDayOfMonth.getDate();

  const days = [];

  // Previous month padding
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startDay - 1; i >= 0; i--) {
    days.push({
      date: new Date(year, month - 1, prevMonthLastDay - i),
      isCurrentMonth: false,
    });
  }

  // Current month
  for (let d = 1; d <= totalDays; d++) {
    days.push({
      date: new Date(year, month, d),
      isCurrentMonth: true,
    });
  }

  // Next month padding to fill 6 rows (42 cells)
  const remaining = 42 - days.length;
  for (let d = 1; d <= remaining; d++) {
    days.push({
      date: new Date(year, month + 1, d),
      isCurrentMonth: false,
    });
  }

  return days;
}

/**
 * Checks if a date falls outside the min/max ISO date strings.
 */
export function isDateDisabled(date, min, max) {
  if (!date) return false;
  const iso = formatDateISO(date);
  if (min && iso < min) return true;
  if (max && iso > max) return true;
  return false;
}
