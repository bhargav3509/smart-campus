/**
 * The DB column is `timestamp without time zone`.
 * The pg driver returns this as a JS Date assuming UTC,
 * which causes a +5:30 shift when displayed in IST.
 *
 * parseLocalTime() re-interprets the raw DB string as LOCAL time
 * so toLocaleString() shows the correct value the user originally entered.
 *
 * Usage: parseLocalTime(event.start_time).toLocaleString([], { ... })
 */
export function parseLocalTime(rawValue) {
  if (!rawValue) return new Date(rawValue);

  // If it already has timezone info (Z or +XX:XX), trust it as-is
  if (typeof rawValue === 'string' && (rawValue.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(rawValue))) {
    return new Date(rawValue);
  }

  // Strip any trailing milliseconds/seconds and reparse as local ISO
  // e.g. "2026-05-18T09:20:00.000Z" → "2026-05-18T09:20:00" → local Date
  const str = typeof rawValue === 'string'
    ? rawValue.replace('Z', '').replace(/\.\d+$/, '') // remove Z and ms
    : new Date(rawValue).toISOString().replace('Z', '').replace(/\.\d+$/, '');

  // Parsing an ISO string WITHOUT trailing Z makes JS treat it as LOCAL time
  return new Date(str);
}

/**
 * Format a DB timestamp for display (local time, no UTC shift).
 */
export function fmtDateTime(rawValue, opts = { dateStyle: 'medium', timeStyle: 'short' }) {
  return parseLocalTime(rawValue).toLocaleString([], opts);
}

export function fmtTime(rawValue, opts = { timeStyle: 'short' }) {
  return parseLocalTime(rawValue).toLocaleString([], opts);
}

export function fmtDate(rawValue, opts = { dateStyle: 'medium' }) {
  return parseLocalTime(rawValue).toLocaleString([], opts);
}
