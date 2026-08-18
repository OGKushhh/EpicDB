import { useEffect, useMemo, useState } from "react";

/** Debounced search input (200ms). */
export function GameSearch({
  value,
  onChange,
  placeholder = "Search by title or app name…",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [local, setLocal] = useState(value);
  useEffect(() => setLocal(value), [value]);

  useEffect(() => {
    if (local === value) return;
    const t = setTimeout(() => onChange(local), 200);
    return () => clearTimeout(t);
  }, [local, value, onChange]);

  return (
    <div className="relative w-full max-w-md">
      <span
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
        aria-hidden
      >
        ⌕
      </span>
      <input
        type="search"
        className="input w-full pl-8"
        placeholder={placeholder}
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        aria-label="Search manifests"
      />
    </div>
  );
}

/** Client-side filter — the backend has no /search endpoint, so filter /titles. */
export function useFilteredGames<TGame>(
  games: TGame[],
  query: string,
  getHaystack: (g: TGame) => string
): TGame[] {
  const q = useMemo(() => query.trim().toLowerCase(), [query]);
  return useMemo(() => {
    if (!q) return games;
    return games.filter((g) => getHaystack(g).toLowerCase().includes(q));
  }, [games, q, getHaystack]);
}
