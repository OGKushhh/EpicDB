/** Sort/order/page-size dropdowns for the Browse page. Matches ScreamDB's filter bar. */

export const PAGE_SIZE_OPTIONS = [12, 24, 48, 96] as const;
export type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];

export const SORT_BY = {
  RELEVANCY: "relevancy",
  TITLE: "title",
  CREATION_DATE: "creationDate",
  RELEASE_DATE: "releaseDate",
  PC_RELEASE_DATE: "pcReleaseDate",
} as const;
export type SortBy = (typeof SORT_BY)[keyof typeof SORT_BY];

export const SORT_DIR = {
  ASC: "ASC",
  DESC: "DESC",
} as const;
export type SortDir = (typeof SORT_DIR)[keyof typeof SORT_DIR];

const SORT_BY_OPTIONS: Array<{ value: SortBy; label: string }> = [
  { value: SORT_BY.RELEVANCY, label: "Relevancy" },
  { value: SORT_BY.TITLE, label: "Title" },
  { value: SORT_BY.CREATION_DATE, label: "Creation date" },
  { value: SORT_BY.RELEASE_DATE, label: "Release date" },
  { value: SORT_BY.PC_RELEASE_DATE, label: "PC release date" },
];

const SORT_DIR_OPTIONS: Array<{ value: SortDir; label: string }> = [
  { value: SORT_DIR.ASC, label: "Ascending" },
  { value: SORT_DIR.DESC, label: "Descending" },
];

export interface GameFiltersState {
  pageSize: PageSize;
  sortBy: SortBy;
  sortDir: SortDir;
}

export interface GameFiltersProps {
  state: GameFiltersState;
  onChange: (next: Partial<GameFiltersState>) => void;
}

/**
 * Compact filter bar — no text labels next to dropdowns (they're self-explanatory
 * from their selected value). Three small dropdowns in a row.
 */
export function GameFilters({ state, onChange }: GameFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        className="input-compact"
        value={state.sortBy}
        onChange={(e) => onChange({ sortBy: e.target.value as SortBy })}
        title="Sort by"
      >
        {SORT_BY_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            Sort: {opt.label}
          </option>
        ))}
      </select>
      <select
        className="input-compact"
        value={state.sortDir}
        onChange={(e) => onChange({ sortDir: e.target.value as SortDir })}
        title="Order"
      >
        {SORT_DIR_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <select
        className="input-compact"
        value={state.pageSize}
        onChange={(e) => onChange({ pageSize: Number(e.target.value) as PageSize })}
        title="Games per page"
      >
        {PAGE_SIZE_OPTIONS.map((n) => (
          <option key={n} value={n}>
            {n} per page
          </option>
        ))}
      </select>
    </div>
  );
}
