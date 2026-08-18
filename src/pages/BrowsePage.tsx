import { useEffect, useState } from "react";
import { useGameSearch, type GameCardData } from "~/hooks/useGameSearch";
import {
  GameFilters,
  SORT_BY,
  SORT_DIR,
  type GameFiltersState,
} from "~/components/Browse/GameFilters";
import { GameGrid } from "~/components/Browse/GameGrid";
import { GameDetailModal } from "~/components/Browse/GameDetailModal";
import { Pagination } from "~/components/Pagination";
import { ErrorBlock, GameGridSkeleton, EmptyState } from "~/components/Loading";

/**
 * Browse page — grid of games from the Epic Games Store (via GraphQL),
 * with search, sort, and pagination. Click a card to open the detail modal
 * with the game's namespace + Item ID and links to the store.
 *
 * This replaces the old "GraphQL Browser" page (which was a Monaco-backed
 * raw query editor). The user-facing experience is now a simple browse grid
 * like ScreamDB.
 */
export function BrowsePage() {
  const [keywords, setKeywords] = useState("");
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState<GameFiltersState>({
    pageSize: 20,
    sortBy: SORT_BY.CREATION_DATE,
    sortDir: SORT_DIR.DESC,
  });
  const [selected, setSelected] = useState<GameCardData | null>(null);

  // Reset to first page when search keywords or sort/page-size changes.
  useEffect(() => {
    setPage(0);
  }, [keywords, filters.pageSize, filters.sortBy, filters.sortDir]);

  // Debounce the keywords input — Epic's endpoint gets grumpy with rapid
  // partial queries.
  const [debouncedKeywords, setDebouncedKeywords] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedKeywords(keywords.trim()), 350);
    return () => clearTimeout(t);
  }, [keywords]);

  const { data, isLoading, error, isFetching } = useGameSearch({
    keywords: debouncedKeywords,
    page,
    pageSize: filters.pageSize,
    sortBy: filters.sortBy,
    sortDir: filters.sortDir,
  });

  const cards = data?.cards ?? [];
  const total = data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / filters.pageSize));

  const onFiltersChange = (next: Partial<GameFiltersState>) =>
    setFilters((prev) => ({ ...prev, ...next }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-4">
      <header className="mb-4">
        <h1 className="text-xl font-semibold">Game Browser</h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          Browse every game on the Epic Games Store. Data is fetched live from
          Epic's GraphQL endpoint.
        </p>
      </header>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <input
          className="input min-w-[16rem] flex-1"
          placeholder="Search by title…"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
        />
        <GameFilters state={filters} onChange={onFiltersChange} />
      </div>

      <div className="mb-3 text-sm text-[var(--color-text-muted)]">
        {isLoading || isFetching
          ? "Loading…"
          : `Found games: ${total.toLocaleString()}`}
      </div>

      {error && <ErrorBlock message={(error as Error).message} />}
      {isLoading && <GameGridSkeleton count={10} />}
      {!isLoading && !error && cards.length === 0 && (
        <EmptyState
          title="No games found"
          hint={
            debouncedKeywords
              ? `No games match "${debouncedKeywords}".`
              : "Epic's GraphQL endpoint returned no games. Try a different sort order or check the CORS proxy."
          }
        />
      )}
      {!isLoading && !error && cards.length > 0 && (
        <div className="flex flex-col gap-4">
          <GameGrid games={cards} onSelect={setSelected} />
          <Pagination
            page={page}
            pageCount={pageCount}
            total={total}
            pageSize={filters.pageSize}
            onChange={setPage}
          />
        </div>
      )}

      <GameDetailModal game={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
