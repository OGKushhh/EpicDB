import { useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteSavedQuery, loadSavedQueries, saveQuery } from "./storage";
import type { SavedQuery } from "~/types/graphql";

const KEY = ["graphql", "savedQueries"] as const;

/** Hook for the saved-queries list. Wraps localStorage in TanStack Query. */
export function useSavedQueries() {
  const qc = useQueryClient();
  const query = useQuery<SavedQuery[]>({
    queryKey: KEY,
    queryFn: () => loadSavedQueries(),
    staleTime: Infinity,
  });

  return {
    list: query.data ?? [],
    add(name: string, query: string, variables: string) {
      saveQuery(name, query, variables);
      void qc.invalidateQueries({ queryKey: KEY });
    },
    remove(id: string) {
      deleteSavedQuery(id);
      void qc.invalidateQueries({ queryKey: KEY });
    },
  };
}

/** UI list of saved queries with one-click load. */
export function SavedQueries({
  list,
  onLoad,
  onDelete,
}: {
  list: SavedQuery[];
  onLoad: (q: SavedQuery) => void;
  onDelete: (id: string) => void;
}) {
  if (list.length === 0) {
    return (
      <div className="card text-xs text-[var(--color-text-muted)]">
        No saved queries yet. Click <b>Save</b> after running a query to keep it
        here.
      </div>
    );
  }
  return (
    <ul className="space-y-1">
      {list.map((q) => (
        <li
          key={q.id}
          className="flex items-center gap-2 rounded-md border border-white/10 bg-[var(--color-base-2)] px-3 py-1.5"
        >
          <button
            type="button"
            onClick={() => onLoad(q)}
            className="flex-1 text-left text-sm hover:text-[var(--color-accent)]"
            title={q.query.slice(0, 80)}
          >
            <div className="font-medium">{q.name}</div>
            <div className="mono text-[10px] text-[var(--color-text-muted)]">
              {new Date(q.createdAt).toLocaleString()}
            </div>
          </button>
          <button
            type="button"
            onClick={() => onDelete(q.id)}
            className="text-[var(--color-text-muted)] hover:text-red-400"
            aria-label="Delete saved query"
          >
            ✕
          </button>
        </li>
      ))}
    </ul>
  );
}
