import { useCallback, useEffect, useState } from "react";
import { useGameSearch } from "~/hooks/useGameSearch";
import {
  GameFilters,
  SORT_BY,
  SORT_DIR,
  type GameFiltersState,
} from "~/components/Browse/GameFilters";
import { GameGrid } from "~/components/Browse/GameGrid";
import { Pagination } from "~/components/Pagination";
import { ErrorBlock, GameGridSkeleton, EmptyState } from "~/components/Loading";

/**
 * Browse page — grid of games from the Epic Games Store (via GraphQL),
 * with search, sort, and pagination. Click a card to navigate to the
 * standalone game detail page at /browse/:namespace.
 */
export function BrowsePage() {
  const [keywords, setKeywords] = useState("");
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState<GameFiltersState>({
    pageSize: 25,
    sortBy: SORT_BY.CREATION_DATE,
    sortDir: SORT_DIR.DESC,
  });

  // Reset to first page immediately when the user types in the search box.
  // Doing this in the change handler (not a useEffect) avoids a stale-render
  // race where `useGameSearch` would briefly fire with the OLD page before
  // the page-reset effect ran — that race produced an empty placeholder grid
  // when changing sort/page-size while on a page > 0.
  const onKeywordsChange = useCallback((value: string) => {
    setKeywords(value);
    setPage(0);
  }, []);

  // Reset to first page immediately when filters change. Same batching fix.
  const onFiltersChange = useCallback(
    (next: Partial<GameFiltersState>) => {
      setFilters((prev) => ({ ...prev, ...next }));
      setPage(0);
    },
    []
  );

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

  return (
    <div className="mx-auto max-w-7xl px-6 py-6">
      <header className="mb-6">
        <h1 className="text-3xl font-semibold">Game Browser</h1>
        <p className="mt-2 text-base text-[var(--color-text-muted)]">
          Browse every game on the Epic Games Store. Data is fetched live from
          Epic's GraphQL endpoint.
        </p>
      </header>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <input
          className="input min-w-[18rem] flex-1"
          placeholder="Search by title…"
          value={keywords}
          onChange={(e) => onKeywordsChange(e.target.value)}
        />
        <GameFilters state={filters} onChange={onFiltersChange} />
      </div>

      <div className="mb-4 text-base text-[var(--color-text-muted)]">
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
        <div className="flex flex-col gap-6">
          <GameGrid games={cards} />
          <Pagination
            page={page}
            pageCount={pageCount}
            total={total}
            pageSize={filters.pageSize}
            onChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
