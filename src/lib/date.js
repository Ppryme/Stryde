/**
 * Returns the current local calendar date as "YYYY-MM-DD".
 * Avoids the UTC-midnight shift that toISOString() causes for
 * users in non-UTC timezones (e.g. UTC+10 at 11 PM).
 */
export function getLocalDateString(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getOneYearAgoDate() {
  const date = new Date();
  date.setDate(date.getDate() - 365);
  // Use local date here too for consistency
  return getLocalDateString(date);
}

export function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
