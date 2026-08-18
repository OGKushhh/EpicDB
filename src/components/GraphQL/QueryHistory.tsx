import type { QueryHistoryEntry } from "~/types/graphql";

/** UI list of recent runs with success/fail badge and one-click reload. */
export function QueryHistory({
  history,
  onLoad,
  onClear,
}: {
  history: QueryHistoryEntry[];
  onLoad: (e: QueryHistoryEntry) => void;
  onClear: () => void;
}) {
  if (history.length === 0) {
    return (
      <div className="card text-xs text-[var(--color-text-muted)]">
        No recent queries. Run one and it will appear here.
      </div>
    );
  }
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
          Recent ({history.length})
        </div>
        <button
          type="button"
          onClick={onClear}
          className="text-xs text-[var(--color-text-muted)] hover:text-red-400"
        >
          Clear
        </button>
      </div>
      <ul className="space-y-1">
        {history.map((h) => (
          <li
            key={h.id}
            className="flex items-center gap-2 rounded-md border border-white/10 bg-[var(--color-base-2)] px-3 py-1.5"
          >
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${
                h.ok ? "bg-emerald-400" : "bg-red-400"
              }`}
              title={h.ok ? "Success" : "Failed"}
            />
            <button
              type="button"
              onClick={() => onLoad(h)}
              className="flex-1 text-left text-xs hover:text-[var(--color-accent)]"
            >
              <div className="mono truncate">{firstLine(h.query) || "(empty query)"}</div>
              <div className="text-[10px] text-[var(--color-text-muted)]">
                {new Date(h.ranAt).toLocaleString()}
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function firstLine(s: string): string {
  return s.split("\n")[0]?.trim() ?? "";
}
