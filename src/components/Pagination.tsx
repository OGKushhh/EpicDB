/**
 * Centered pagination bar with prev/next + page numbers + an ellipsis when
 * there are too many pages. Used by the Manifest table and the Browse grid.
 *
 * Matches the ScreamDB look: outlined rounded buttons, dark theme.
 */

const MAX_VISIBLE_PAGES = 7;

export function Pagination({
  page,
  pageCount,
  total,
  pageSize,
  onChange,
}: {
  /** Current page, 0-indexed. */
  page: number;
  /** Total number of pages. */
  pageCount: number;
  /** Total number of items across all pages (for the "showing X–Y of Z" label). */
  total: number;
  /** Items per page. */
  pageSize: number;
  /** Callback when the user changes the page. */
  onChange: (page: number) => void;
}) {
  if (pageCount <= 1) {
    // Still show the count summary even when there's a single page.
    return (
      <div className="text-center text-xs text-[var(--color-text-muted)] py-2">
        {total} {total === 1 ? "entry" : "entries"}
      </div>
    );
  }

  // Build the list of page numbers to render, with an ellipsis if needed.
  const pages = buildPageList(page, pageCount, MAX_VISIBLE_PAGES);
  const startIdx = page * pageSize + 1;
  const endIdx = Math.min((page + 1) * pageSize, total);

  return (
    <div className="flex flex-col items-center gap-2 py-2">
      <nav className="flex items-center gap-1">
        <button
          onClick={() => onChange(Math.max(0, page - 1))}
          disabled={page === 0}
          className="page-btn"
          aria-label="Previous page"
        >
          ‹
        </button>
        {pages.map((p, idx) =>
          p === "…" ? (
            <span key={`ellipsis-${idx}`} className="px-2 text-[var(--color-text-muted)]">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p)}
              className={`page-btn ${p === page ? "page-btn-active" : ""}`}
              aria-current={p === page ? "page" : undefined}
            >
              {p + 1}
            </button>
          )
        )}
        <button
          onClick={() => onChange(Math.min(pageCount - 1, page + 1))}
          disabled={page === pageCount - 1}
          className="page-btn"
          aria-label="Next page"
        >
          ›
        </button>
      </nav>
      <div className="text-xs text-[var(--color-text-muted)]">
        Showing {startIdx}–{endIdx} of {total}
      </div>
    </div>
  );
}

type PageOrEllipsis = number | "…";

/**
 * Build the list of page numbers to render. Always includes first and last
 * page; tries to keep a window of pages around the current page; inserts an
 * ellipsis when there's a gap.
 */
function buildPageList(current: number, total: number, maxVisible: number): PageOrEllipsis[] {
  if (total <= maxVisible) {
    return Array.from({ length: total }, (_, i) => i);
  }
  // Always show first, last, and a window around `current`.
  const half = Math.floor((maxVisible - 4) / 2); // 2 ellipses + first + last
  let start = current - half;
  let end = current + half;
  if (start < 1) {
    end += 1 - start;
    start = 1;
  }
  if (end > total - 2) {
    start -= end - (total - 2);
    end = total - 2;
  }
  start = Math.max(1, start);
  end = Math.min(total - 2, end);

  const pages: PageOrEllipsis[] = [0];
  if (start > 1) pages.push("…");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 2) pages.push("…");
  pages.push(total - 1);
  return pages;
}
