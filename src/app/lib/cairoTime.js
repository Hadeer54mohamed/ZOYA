export const CAIRO_TZ = "Africa/Cairo";

export function toCairoDate(iso) {
  if (!iso) return null;
  const normalized =
    typeof iso === "string" &&
    !/[zZ]|[+-]\d{2}:?\d{2}$/.test(iso) &&
    /\d{2}:\d{2}/.test(iso)
      ? `${iso}Z`
      : iso;
  const utc = new Date(normalized);
  if (isNaN(utc)) return null;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: CAIRO_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(utc);
  const get = (t) => Number(parts.find((p) => p.type === t)?.value || 0);
  return new Date(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour") % 24,
    get("minute"),
    get("second"),
  );
}

export function cairoWallNow() {
  return toCairoDate(new Date().toISOString()) ?? new Date();
}

export function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function startOfMonth(d) {
  const x = new Date(d);
  x.setDate(1);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Week starts Saturday (Egypt). */
export function startOfWeek(d) {
  const x = startOfDay(d);
  const day = x.getDay();
  const diff = (day - 6 + 7) % 7;
  x.setDate(x.getDate() - diff);
  return x;
}

export function startOfYear(d) {
  const x = new Date(d);
  x.setMonth(0, 1);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function addMonths(d, n) {
  const x = new Date(d);
  x.setMonth(x.getMonth() + n);
  return x;
}

export function fmtMonthYear(d) {
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function fmtShortDate(d) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function fmtLongDate(d) {
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
