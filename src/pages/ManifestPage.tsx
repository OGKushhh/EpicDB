import { useCallback, useMemo, useState } from "react";
import { useTitles } from "~/hooks/useManifests";
import type { ManifestTitleEntry, ManifestTitleGroup } from "~/types/manifest";
import { ErrorBlock, GameGridSkeleton, EmptyState } from "~/components/Loading";
import { GameSearch, useFilteredGames } from "~/components/Manifest/GameSearch";
import { GameStats } from "~/components/Manifest/GameStats";
import { ManifestCardGrid } from "~/components/Manifest/ManifestCardGrid";
import { GameDetail } from "~/components/Manifest/GameDetail";
import { SlideOver } from "~/components/SlideOver";
import { Pagination } from "~/components/Pagination";
import {
  ManifestFilters,
  SORT_BY,
  SORT_DIR,
  type ManifestFiltersState,
} from "~/components/Manifest/ManifestFilters";

/** Default entries per page in the manifest grid. */
const DEFAULT_PAGE_SIZE = 25;

/** A flattened entry paired with its parent group for easy pagination. */
interface FlatEntry {
  entry: ManifestTitleEntry;
  group: ManifestTitleGroup;
}

/**
 * Manifest Browser page — lists all games from the /titles endpoint as a card
 * grid (display_name as title, color-coded by file_type, per-card download +
 * Details buttons). Search/filter/sort client-side; paginated. Clicking
 * "Details" opens a slide-over panel with full metadata from /info.
 *
 * Uses `effective_id` from each entry for both display and the /info +
 * /download URLs (never the raw `build_id`).
 */
export function ManifestPage() {
  const { data, isLoading, error, refetch } = useTitles();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState<ManifestFiltersState>({
    pageSize: DEFAULT_PAGE_SIZE,
    sortBy: SORT_BY.UPLOADED_AT,
    sortDir: SORT_DIR.DESC,
  });
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

  // Sort the flat entries per the user's sort selection.
  const sortedEntries = useMemo(() => {
    const arr = [...flatEntries];
    const dir = filters.sortDir === SORT_DIR.ASC ? 1 : -1;
    const cmp = (a: FlatEntry, b: FlatEntry): number => {
      switch (filters.sortBy) {
        case SORT_BY.EFFECTIVE_ID:
          return a.entry.effective_id.localeCompare(b.entry.effective_id) * dir;
        case SORT_BY.FILE_TYPE:
          return a.entry.file_type.localeCompare(b.entry.file_type) * dir;
        case SORT_BY.BUILD_VERSION:
          return (a.entry.build_version || "").localeCompare(b.entry.build_version || "") * dir;
        case SORT_BY.APP_NAME:
          return a.group.app_name.localeCompare(b.group.app_name) * dir;
        case SORT_BY.UPLOADED_AT:
        default:
          return (
            (new Date(a.entry.uploaded_at).getTime() -
              new Date(b.entry.uploaded_at).getTime()) *
            dir
          );
      }
    };
    return arr.sort(cmp);
  }, [flatEntries, filters.sortBy, filters.sortDir]);

  const pageCount = Math.max(1, Math.ceil(sortedEntries.length / filters.pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const pageEntries = useMemo(
    () => sortedEntries.slice(safePage * filters.pageSize, (safePage + 1) * filters.pageSize),
    [sortedEntries, safePage, filters.pageSize]
  );

  // Reset to first page when search query or sort/page-size changes.
  const onQueryChange = useCallback((q: string) => {
    setQuery(q);
    setPage(0);
  }, []);
  const onFiltersChange = useCallback((next: Partial<ManifestFiltersState>) => {
    setFilters((prev) => ({ ...prev, ...next }));
    setPage(0);
  }, []);

  const closeSlideOver = useCallback(() => setSelected(null), []);

  return (
    <div className="mx-auto max-w-7xl px-6 py-6">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">Manifest Browser</h1>
          <p className="mt-2 text-base text-[var(--color-text-muted)]">
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

      <div className="mt-5 mb-4 flex flex-wrap items-center justify-between gap-3">
        <GameSearch value={query} onChange={onQueryChange} />
        <ManifestFilters state={filters} onChange={onFiltersChange} />
      </div>

      <div className="mb-3 text-base text-[var(--color-text-muted)]">
        {filtered.length} of {data?.games.length ?? 0} games ·{" "}
        {sortedEntries.length} entries
      </div>

      {isLoading && <GameGridSkeleton count={6} />}
      {error && <ErrorBlock message={(error as Error).message} />}
      {!isLoading && !error && sortedEntries.length === 0 && (
        <EmptyState
          title="No manifests found"
          hint={
            data?.games.length
              ? "Try a different search term."
              : "Upload some manifests to the backend first."
          }
        />
      )}

      {!isLoading && !error && sortedEntries.length > 0 && (
        <div className="flex flex-col gap-5">
          <ManifestCardGrid
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
            total={sortedEntries.length}
            pageSize={filters.pageSize}
            onChange={setPage}
          />
        </div>
      )}

      <SlideOver
        open={selected !== null}
        onClose={closeSlideOver}
        title={selected ? selected.entry.effective_id : ""}
        subtitle={selected ? selected.group.display_name || selected.group.app_name : "Details"}
      >
        {selected && <GameDetail group={selected.group} entry={selected.entry} />}
      </SlideOver>
    </div>
  );
}
