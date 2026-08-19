/**
 * Format an ISO-8601 timestamp as a relative "time ago" string.
 *
 * Examples:
 *   - "just now"        (< 60s)
 *   - "5m ago"          (< 1h)
 *   - "3h ago"          (< 1d)
 *   - "4d ago"          (< 30d)
 *   - "2025-01-15"      (>= 30d — fall back to a short absolute date)
 *
 * Used in the Manifest card grid so users can scan recent uploads at a glance
 * without having to read full timestamps in every row.
 */
export function formatRelativeTime(iso: string): string {
  try {
    const then = new Date(iso).getTime();
    const now = Date.now();
    const diffMs = now - then;
    if (diffMs < 0) return "just now"; // clock skew
    const sec = Math.floor(diffMs / 1000);
    if (sec < 60) return "just now";
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const day = Math.floor(hr / 24);
    if (day < 30) return `${day}d ago`;
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return iso;
  }
}

/** Format an ISO-8601 timestamp as a full localized date-time string. */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

/** Format a byte count as a human-readable size string. */
export function formatBytes(n: number): string {
  if (!n) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(n) / Math.log(1024));
  return `${(n / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}
