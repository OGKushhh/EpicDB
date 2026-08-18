import { useCallback, useMemo, useState } from "react";
import { useTitles } from "~/hooks/useManifests";
import type { ManifestTitleEntry, ManifestTitleGroup } from "~/types/manifest";
import { ErrorBlock, GameGridSkeleton, EmptyState } from "~/components/Loading";
import { GameSearch, useFilteredGames } from "~/components/Manifest/GameSearch";
import { GameStats } from "~/components/Manifest/GameStats";
import { GameList } from "~/components/Manifest/GameList";
import { GameDetail } from "~/components/Manifest/GameDetail";
import { Pagination } from "~/components/Pagination";

/** Entries per page in the manifest table. */
const PAGE_SIZE = 25;

/** A flattened entry paired with its parent group for easy pagination. */
interface FlatEntry {
  entry: ManifestTitleEntry;
  group: ManifestTitleGroup;
}

/**
 * Manifest Browser page — lists all games from the /titles endpoint, lets the
 * user search/filter (client-side), paginates the entries, and shows full
 * metadata when an entry is selected. Uses `effective_id` from each entry for
 * both display and the /info + /download URLs (never the raw `build_id`).
 */
export function ManifestPage() {
  const { data, isLoading, error, refetch } = useTitles();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] =
    useState<{ group: ManifestTitleGroup; entry: ManifestTitleEntry } | null>(null);

  const haystackFn = useCallback(
    (g: ManifestTitleGroup) =>
      `${g.display_name} ${g.app_name} ${g.build_versions.join(" ")} ${g.entries
        .map((e) => e.effective_id)
        .join(" ")}`,
    []
  );
  const filtered = useFilteredGames(data?.games ?? [], query, haystackFn);

  // Flatten filtered groups into a single list of {entry, group} for pagination.
  const flatEntries = useMemo<FlatEntry[]>(
    () =>
      filtered.flatMap((group) =>
        group.entries.map((entry) => ({ entry, group }))
      ),
    [filtered]
  );

  const pageCount = Math.max(1, Math.ceil(flatEntries.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageEntries = useMemo(
    () => flatEntries.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE),
    [flatEntries, safePage]
  );

  // Reset to first page when the search query changes.
  const onQueryChange = useCallback((q: string) => {
    setQuery(q);
    setPage(0);
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-4">
      <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Manifest Browser</h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            Browse every manifest stored in the Epic-Unlocker database.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="btn-outline"
          title="Refresh /titles"
        >
          ↻ Refresh
        </button>
      </header>

      <GameStats />

      <div className="mt-4 mb-3 flex items-center justify-between gap-3">
        <GameSearch value={query} onChange={onQueryChange} />
        <div className="text-xs text-[var(--color-text-muted)]">
          {filtered.length} of {data?.games.length ?? 0} games ·{" "}
          {flatEntries.length} entries
        </div>
      </div>

      {isLoading && <GameGridSkeleton count={6} />}
      {error && <ErrorBlock message={(error as Error).message} />}
      {!isLoading && !error && flatEntries.length === 0 && (
        <EmptyState
          title="No manifests found"
          hint={
            data?.games.length
              ? "Try a different search term."
              : "Upload some manifests to the backend first."
          }
        />
      )}

      {!isLoading && !error && flatEntries.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_22rem]">
          <div className="flex flex-col gap-3">
            <GameList
              entries={pageEntries}
              onSelect={(entry, group) => setSelected({ group, entry })}
              selected={
                selected
                  ? { appName: selected.group.app_name, effectiveId: selected.entry.effective_id }
                  : null
              }
            />
            <Pagination
              page={safePage}
              pageCount={pageCount}
              total={flatEntries.length}
              pageSize={PAGE_SIZE}
              onChange={setPage}
            />
          </div>
          {selected && <GameDetail group={selected.group} entry={selected.entry} />}
        </div>
      )}
    </div>
  );
}
