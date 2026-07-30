

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR   = 60 * MINUTE;
const DAY    = 24 * HOUR;

const safeDate = (v) => {
  if (v instanceof Date) return Number.isFinite(v.getTime()) ? v : null;
  if (typeof v === "number") {
    const d = new Date(v);
    return Number.isFinite(d.getTime()) ? d : null;
  }
  if (typeof v !== "string" || v.length === 0) return null;
  const d = new Date(v);
  return Number.isFinite(d.getTime()) ? d : null;
};

export const formatDate = (value, opts = { year: "numeric", month: "short", day: "numeric" }) => {
  const d = safeDate(value);
  if (!d) return "—";
  try {
    return d.toLocaleDateString(undefined, opts);
  } catch (_) {
    return d.toDateString();
  }
};

export const formatTime = (value) => {
  const d = safeDate(value);
  if (!d) return "—";
  try {
    return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  } catch (_) {
    return d.toTimeString().slice(0, 5);
  }
};

export const formatDateTime = (value) => `${formatDate(value)} • ${formatTime(value)}`;

export const formatRelative = (value, now = Date.now()) => {
  const d = safeDate(value);
  if (!d) return "";
  const diff = now - d.getTime();
  if (diff < 0) return "just now";
  if (diff < MINUTE) return "just now";
  if (diff < HOUR)   return `${Math.floor(diff / MINUTE)}m ago`;
  if (diff < DAY)    return `${Math.floor(diff / HOUR)}h ago`;
  if (diff < 7 * DAY) return `${Math.floor(diff / DAY)}d ago`;
  return formatDate(value);
};

export const formatCurrency = (cents, currency = "USD") => {
  if (typeof cents !== "number" || Number.isNaN(cents)) return "—";
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(cents / 100);
  } catch (_) {
    return `$${(cents / 100).toFixed(2)}`;
  }
};

export const formatNumber = (value, digits = 0) => {
  if (typeof value !== "number" || Number.isNaN(value)) return "0";
  return Number.isFinite(value) ? value.toFixed(digits) : "0";
};

export const formatPercent = (value, digits = 0) => {
  const n = typeof value === "number" && Number.isFinite(value) ? value : 0;
  return `${n.toFixed(digits)}%`;
};

export const formatFileSize = (bytes) => {
  if (typeof bytes !== "number" || bytes <= 0 || Number.isNaN(bytes)) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let val = bytes;
  let i = 0;
  while (val >= 1024 && i < units.length - 1) { val /= 1024; i += 1; }
  return `${val.toFixed(val < 10 ? 1 : 0)} ${units[i]}`;
};

export const truncate = (s, n = 80) => {
  if (typeof s !== "string") return "";
  return s.length <= n ? s : `${s.slice(0, n - 1).trim()}…`;
};

export const formatSensorValue = (value, unit) => {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  return `${value.toFixed(2)} ${unit || ""}`.trim();
};

export default {
  formatDate,
  formatTime,
  formatDateTime,
  formatRelative,
  formatCurrency,
  formatNumber,
  formatPercent,
  formatFileSize,
  truncate,
  formatSensorValue,
};
