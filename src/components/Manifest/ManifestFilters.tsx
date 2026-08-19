/** Sort/filter/page-size dropdowns for the Manifest page. Same compact style as Browse. */

import { PAGE_SIZE_OPTIONS as BROWSE_PAGE_SIZE_OPTIONS } from "~/components/Browse/GameFilters";

// Reuse the same page size options as Browse (10, 25, 50, 100).
export const PAGE_SIZE_OPTIONS = BROWSE_PAGE_SIZE_OPTIONS;
export type PageSize = (typeof BROWSE_PAGE_SIZE_OPTIONS)[number];

export const SORT_BY = {
  UPLOADED_AT: "uploaded_at",
  EFFECTIVE_ID: "effective_id",
  BUILD_VERSION: "build_version",
  APP_NAME: "app_name",
} as const;
export type SortBy = (typeof SORT_BY)[keyof typeof SORT_BY];

export const SORT_DIR = {
  ASC: "ASC",
  DESC: "DESC",
} as const;
export type SortDir = (typeof SORT_DIR)[keyof typeof SORT_DIR];

/** Filter the entry list by file_type. "" = no filter (show both). */
export const FILE_TYPE_FILTER = {
  ALL: "",
  BINARY: "binary",
  JSON: "json",
} as const;
export type FileTypeFilter = (typeof FILE_TYPE_FILTER)[keyof typeof FILE_TYPE_FILTER];

const SORT_BY_OPTIONS: Array<{ value: SortBy; label: string }> = [
  { value: SORT_BY.UPLOADED_AT, label: "Upload date" },
  { value: SORT_BY.EFFECTIVE_ID, label: "Build ID" },
  { value: SORT_BY.BUILD_VERSION, label: "Build version" },
  { value: SORT_BY.APP_NAME, label: "App name" },
];

const SORT_DIR_OPTIONS: Array<{ value: SortDir; label: string }> = [
  { value: SORT_DIR.ASC, label: "Ascending" },
  { value: SORT_DIR.DESC, label: "Descending" },
];

const FILE_TYPE_OPTIONS: Array<{ value: FileTypeFilter; label: string }> = [
  { value: FILE_TYPE_FILTER.ALL, label: "All types" },
  { value: FILE_TYPE_FILTER.BINARY, label: "Binary (.manifest)" },
  { value: FILE_TYPE_FILTER.JSON, label: "JSON (.item)" },
];

export interface ManifestFiltersState {
  pageSize: PageSize;
  sortBy: SortBy;
  sortDir: SortDir;
  /** "" = show all entries; "binary" / "json" = only show that file_type. */
  fileType: FileTypeFilter;
}

export interface ManifestFiltersProps {
  state: ManifestFiltersState;
  onChange: (next: Partial<ManifestFiltersState>) => void;
}

/**
 * Compact filter bar — no text labels next to dropdowns. Same style as Browse's
 * GameFilters so the two pages feel consistent.
 */
export function ManifestFilters({ state, onChange }: ManifestFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        className="input-compact"
        value={state.fileType}
        onChange={(e) => onChange({ fileType: e.target.value as FileTypeFilter })}
        title="Filter by file type"
      >
        {FILE_TYPE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
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
        title="Entries per page"
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
