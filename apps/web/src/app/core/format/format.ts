// Formatters are created once: constructing Intl objects is comparatively expensive.
const LOCALE = 'ar-SA-u-ca-gregory-nu-latn';
const number = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 });
const decimal = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 1 });

const dateFormats = {
  long: new Intl.DateTimeFormat(LOCALE, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }),
  short: new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'long', timeZone: 'UTC' }),
  weekday: new Intl.DateTimeFormat(LOCALE, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }),
  month: new Intl.DateTimeFormat(LOCALE, { month: 'long', year: 'numeric', timeZone: 'UTC' }),
  dayName: new Intl.DateTimeFormat(LOCALE, { weekday: 'short', timeZone: 'UTC' }),
  day: new Intl.DateTimeFormat(LOCALE, { day: 'numeric', timeZone: 'UTC' }),
  monthName: new Intl.DateTimeFormat(LOCALE, { month: 'long', timeZone: 'UTC' }),
} as const;

const dateTime = new Intl.DateTimeFormat(LOCALE, {
  day: 'numeric',
  month: 'long',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'Asia/Riyadh',
});

export type DateStyle = keyof typeof dateFormats;

export function formatNumber(value: number): string {
  return number.format(value);
}

export function formatDecimal(value: number): string {
  return decimal.format(value);
}

/** Whole riyals with grouping; the currency label is appended consistently across browsers. */
export function formatSar(value: number): string {
  const sign = value < 0 ? '−' : '';
  return `${sign}${number.format(Math.abs(value))} ر.س`;
}

/** Parses a calendar date (YYYY-MM-DD) as UTC midnight so no timezone shifts the day. */
export function parseIsoDate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

/** Calendar arithmetic on ISO dates, independent of the device timezone. */
export function addDays(iso: string, days: number): string {
  const date = parseIsoDate(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Local-midnight Date for an ISO date, as date pickers expect. */
export function localDate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDate(iso: string, style: DateStyle = 'long'): string {
  return dateFormats[style].format(parseIsoDate(iso));
}

export function formatDateTime(isoDateTime: string): string {
  return dateTime.format(new Date(isoDateTime));
}

export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((parseIsoDate(toIso).getTime() - parseIsoDate(fromIso).getTime()) / 86_400_000);
}
