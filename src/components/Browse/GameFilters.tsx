/** Sort/order/page-size dropdowns for the Browse page. Matches ScreamDB's filter bar. */

export const PAGE_SIZE_OPTIONS = [10, 20, 40] as const;
export type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];

export const SORT_BY = {
  RELEVANCY: "relevancy",
  TITLE: "title",
  CREATION_DATE: "creationDate",
  RELEASE_DATE: "releaseDate",
  PC_RELEASE_DATE: "pcReleaseDate",
  CURRENT_PRICE: "currentPrice",
} as const;
export type SortBy = (typeof SORT_BY)[keyof typeof SORT_BY];

export const SORT_DIR = {
  ASC: "ASC",
  DESC: "DESC",
} as const;
export type SortDir = (typeof SORT_DIR)[keyof typeof SORT_DIR];

const SORT_BY_LABELS: Record<SortBy, string> = {
  [SORT_BY.RELEVANCY]: "Relevancy",
  [SORT_BY.TITLE]: "Title",
  [SORT_BY.CREATION_DATE]: "Creation date",
  [SORT_BY.RELEASE_DATE]: "Release date",
  [SORT_BY.PC_RELEASE_DATE]: "PC release date",
  [SORT_BY.CURRENT_PRICE]: "Price",
};

const SORT_DIR_LABELS: Record<SortDir, string> = {
  [SORT_DIR.ASC]: "Ascending",
  [SORT_DIR.DESC]: "Descending",
};

export interface GameFiltersState {
  pageSize: PageSize;
  sortBy: SortBy;
  sortDir: SortDir;
}

export interface GameFiltersProps {
  state: GameFiltersState;
  onChange: (next: Partial<GameFiltersState>) => void;
}

export function GameFilters({ state, onChange }: GameFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
        <span>Sort by</span>
        <select
          className="input !py-1 !text-xs"
          value={state.sortBy}
          onChange={(e) => onChange({ sortBy: e.target.value as SortBy })}
        >
          {(Object.keys(SORT_BY) as Array<keyof typeof SORT_BY>).map((key) => (
            <option key={key} value={SORT_BY[key]}>
              {SORT_BY_LABELS[SORT_BY[key]]}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
        <span>Order</span>
        <select
          className="input !py-1 !text-xs"
          value={state.sortDir}
          onChange={(e) => onChange({ sortDir: e.target.value as SortDir })}
        >
          {(Object.keys(SORT_DIR) as Array<keyof typeof SORT_DIR>).map((key) => (
            <option key={key} value={SORT_DIR[key]}>
              {SORT_DIR_LABELS[SORT_DIR[key]]}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
        <span>Games per page</span>
        <select
          className="input !py-1 !text-xs"
          value={state.pageSize}
          onChange={(e) => onChange({ pageSize: Number(e.target.value) as PageSize })}
        >
          {PAGE_SIZE_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
