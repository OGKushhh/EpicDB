import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link } from "react-router";
import { useGameOffers, pickOfferImageUrl } from "~/hooks/useGameOffers";
import { useEgdataEnrichment, pickBaseGameOfferId } from "~/hooks/useEgdataEnrichment";
import type { OfferElement, GameInfo } from "~/api/graphql";
import { routes } from "~/components/Header";
import { ErrorBlock, LoadingFallback, EmptyState } from "~/components/Loading";
import { Pagination } from "~/components/Pagination";
import { JsonViewer } from "~/components/JsonViewer";
import { getResizedImageUrl } from "~/utils/imageResize";
import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css';

/** Below this many offers, we don't bother showing pagination — just render
 *  all rows. Above the threshold, paginate (10 per page). */
const OFFERS_PAGINATION_THRESHOLD = 10;
const OFFERS_PAGE_SIZE = 10;

/** DRM / anti-cheat related feature names from egdata that matter for unlocker. */
const DRM_FEATURE_NAMES = new Set([
  "DRM",
  "Denuvo Anti-Cheat",
  "Easy Anti-Cheat",
  "BattlEye",
  "nProtect GameGuard",
  "Valve Anti-Cheat",
  "Arxan",
  "SecuROM",
  "VMProtect",
]);

/** Other useful feature names to display. */
const NOTABLE_FEATURE_NAMES = new Set([
  "Cloud Saves",
  "Single Player",
  "Multiplayer",
  "Co-op",
  "Online Multiplayer",
  "LAN",
  "PvP",
  "Cross Platform",
  "Controller Support",
  "Remote Play",
]);

/**
 * Game detail page — standalone route at /browse/:namespace.
 * Shows: hero image + game info (title, namespace, releaseDate, DRM flags,
 * egdata price stats) on top, then a searchable/filterable table of catalog
 * offers with row selection and Export to JSON.
 */
export function GameOffersPage() {
  const { namespace = "" } = useParams();
  const { data, isLoading, error } = useGameOffers(namespace);

  if (isLoading) return <LoadingFallback label="Loading game + offers…" />;
  if (error) return <ErrorBlock message={(error as Error).message} />;
  if (!data) return null;
  if (!data.game) {
    return (
      <EmptyState
        title="Game not found"
        hint={`No game found for namespace "${namespace}".`}
      />
    );
  }
  return <GameOffersContent game={data.game} offers={data.offers} />;
}

function GameOffersContent({
  game,
  offers,
}: {
  game: GameInfo;
  offers: OfferElement[];
}) {
  const baseOfferId = useMemo(() => pickBaseGameOfferId(offers), [offers]);
  const egdata = useEgdataEnrichment(baseOfferId);

  // Derive "was free" from egdata price-stats (lowest price ever = 0)
  const wasFreeFromEgdata = useMemo(() => {
    if (!egdata.priceStats) return false;
    const lowest = egdata.priceStats.lowest;
    if (!lowest) return false;
    return lowest.price === 0;
  }, [egdata.priceStats]);

  // Split features into DRM vs notable
  const { drmFeatures, notableFeatures } = useMemo(() => {
    const drm: string[] = [];
    const notable: string[] = [];
    for (const f of egdata.features) {
      // Only show features that are truthy
      if (typeof f.value === "string" && f.value !== "" && f.value !== "false" && f.value !== "0") {
        if (DRM_FEATURE_NAMES.has(f.name)) drm.push(f.value === "true" ? f.name : f.value);
        else if (NOTABLE_FEATURE_NAMES.has(f.name)) notable.push(f.name);
      } else if (typeof f.value === "boolean" && f.value) {
        if (DRM_FEATURE_NAMES.has(f.name)) drm.push(f.name);
        else if (NOTABLE_FEATURE_NAMES.has(f.name)) notable.push(f.name);
      }
    }
    return { drmFeatures: drm, notableFeatures: notable };
  }, [egdata.features]);

  return (
    <div className="mx-auto max-w-7xl px-6 py-6">
      {/* Top: banner + info */}
      <div className="mb-6 flex flex-col gap-6 sm:flex-row">
        <div className="shrink-0">
          <div className="aspect-[16/9] w-80 overflow-hidden rounded-lg border border-white/10 bg-[var(--color-bg-3)]">
            {pickBannerUrl(game.keyImages) ? (
              <Zoom zoomImg={{ src: pickBannerUrl(game.keyImages) ?? "" }}>
                <img
                  src={getResizedImageUrl({ url: pickBannerUrl(game.keyImages)!, w: 640, h: 360, q: 'medium' }) ?? pickBannerUrl(game.keyImages)!}
                  alt={game.title}
                  className="h-full w-full cursor-zoom-in object-cover"
                />
              </Zoom>
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-[var(--color-text-muted)]">
                no image
              </div>
            )}
          </div>
          <div className="mt-3 flex gap-2">
            <a
              href={`https://store.epicgames.com/en-US/p/${game.catalogNs?.mappings?.[0]?.pageSlug ?? game.namespace}`}
              target="_blank"
              rel="noreferrer noopener"
              className="btn-primary !text-sm"
            >
              View on Epic Store →
            </a>
            <a
              href={`https://egdata.app/games/${game.namespace}`}
              target="_blank"
              rel="noreferrer noopener"
              className="btn-outline !text-sm"
            >
              egdata.app →
            </a>
          </div>
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{game.title}</h1>
          <CopyableRow label="Namespace" value={game.namespace} />
          <CopyableRow label="Item ID" value={game.id} />
          {game.releaseDate && (
            <InfoRow label="Release Date" value={formatDate(game.releaseDate)} />
          )}

          {/* egdata "was free" badge (from price-history) */}
          {egdata.priceStatsLoading && (
            <div className="mt-2 flex items-center gap-3 text-sm">
              <div className="w-32 shrink-0 text-[var(--color-text-muted)]">Free History</div>
              <span className="text-xs text-[var(--color-text-muted)]">Checking…</span>
            </div>
          )}
          {!egdata.priceStatsLoading && wasFreeFromEgdata && (
            <div className="mt-2 flex items-center gap-3 text-sm">
              <div className="w-32 shrink-0 text-[var(--color-text-muted)]">Free History</div>
              <span className="inline-flex items-center rounded-full bg-[var(--color-accent)]/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase text-[var(--color-accent)]">
                Was Free
              </span>
            </div>
          )}

          {/* DRM / features from egdata */}
          {egdata.featuresLoading && (
            <InfoRow label="Features" value="Loading…" />
          )}
          {!egdata.featuresLoading && (drmFeatures.length > 0 || notableFeatures.length > 0) && (
            <div className="mt-3 flex flex-col gap-2">
              <div className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
                Features
              </div>
              <div className="flex flex-wrap gap-1.5">
                {drmFeatures.map((f) => (
                  <span
                    key={f}
                    className="inline-flex items-center rounded-full bg-red-500/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase text-red-400"
                  >
                    {f}
                  </span>
                ))}
                {notableFeatures.map((f) => (
                  <span
                    key={f}
                    className="inline-flex items-center rounded-full bg-[var(--color-accent-blue)]/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase text-[var(--color-accent-blue)]"
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}
          {!egdata.featuresLoading && egdata.featuresError && (
            <InfoRow label="Features" value="Unavailable (egdata)" />
          )}

          {game.description && (
            <div className="mt-4">
              <div className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
                Description
              </div>
              <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-muted)]">
                {game.description}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom: offers table with search + filters + selection + export */}
      <OffersTable
        offers={offers}
        wasFreeOfferIds={wasFreeFromEgdata ? undefined : undefined}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Reusable info row components                                       */
/* ------------------------------------------------------------------ */

function InfoRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="mt-2 flex items-center gap-3 text-sm">
      <div className="w-32 shrink-0 text-[var(--color-text-muted)]">{label}</div>
      <code className={`flex-1 break-all ${mono ? "mono" : ""}`}>{value}</code>
    </div>
  );
}

/** Click-to-copy info row — copies on click, shows brief feedback. */
function CopyableRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1200);
    } catch {
      // fallback: do nothing
    }
  }, [value]);

  return (
    <div
      className="mt-2 flex cursor-pointer items-center gap-3 text-sm transition-colors hover:bg-white/5 rounded px-1 -mx-1"
      onClick={handleCopy}
      title="Click to copy"
    >
      <div className="w-32 shrink-0 text-[var(--color-text-muted)]">{label}</div>
      <code className="mono flex-1 break-all">{value}</code>
      <span className="shrink-0 text-[10px] text-[var(--color-text-muted)] transition-opacity">
        {copied ? "Copied!" : "Click to copy"}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

/** Pick the best banner image URL from a game's keyImages. */
function pickBannerUrl(
  keyImages?: Array<{ type: string; url: string }>
): string | null {
  if (!keyImages?.length) return null;
  const preferred = [
    "DieselStoreFrontWide",
    "OfferImageWide",
    "DellImage",
    "Thumbnail",
  ];
  for (const type of preferred) {
    const found = keyImages.find((k) => k.type === type);
    if (found) return found.url;
  }
  return keyImages[0].url;
}

/** Format an ISO date string to a readable date. */
function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

/** Check if an offer was ever free (originalPrice > 0 but discountPrice === 0). */
function isWasFree(o: OfferElement): boolean {
  const p = o.price?.price;
  if (!p) return false;
  return p.originalPrice > 0 && p.discountPrice === 0;
}

/* ------------------------------------------------------------------ */
/*  Offers table with search, filter, selection, export                */
/* ------------------------------------------------------------------ */

/** Clickable item ID that copies on click. */
function CopyableItemId({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleClick = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore
    }
  }, [id]);

  return (
    <div
      className="mono cursor-pointer rounded px-0.5 text-xs break-all transition-colors hover:bg-[var(--color-accent-blue)]/15 hover:text-[var(--color-accent-blue)]"
      onClick={handleClick}
      title="Click to copy"
    >
      {id}
      {copied && (
        <span className="ml-1 text-[9px] text-[var(--color-accent)]">copied</span>
      )}
    </div>
  );
}

function OffersTable({ offers }: { offers: OfferElement[] }) {
  const [search, setSearch] = useState("");
  const [offerType, setOfferType] = useState<string>("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showJsonDialog, setShowJsonDialog] = useState(false);

  // Reset to first page when search/filter changes.
  useEffect(() => {
    setPage(0);
  }, [search, offerType]);

  // Unique offer types for the filter dropdown.
  const offerTypes = useMemo(() => {
    const set = new Set<string>();
    offers.forEach((o) => o.offerType && set.add(o.offerType));
    return Array.from(set).sort();
  }, [offers]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return offers.filter((o) => {
      if (offerType && o.offerType !== offerType) return false;
      if (!q) return true;
      return (
        o.title.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q) ||
        o.items.some((it) => it.id.toLowerCase().includes(q))
      );
    });
  }, [offers, search, offerType]);

  // Only paginate when the filtered set crosses the threshold.
  const usePagination = filtered.length > OFFERS_PAGINATION_THRESHOLD;
  const pageCount = usePagination
    ? Math.max(1, Math.ceil(filtered.length / OFFERS_PAGE_SIZE))
    : 1;
  const safePage = Math.min(page, pageCount - 1);
  const paged = usePagination
    ? filtered.slice(safePage * OFFERS_PAGE_SIZE, (safePage + 1) * OFFERS_PAGE_SIZE)
    : filtered;

  // --- Selection logic (mirrors ScreamDB's OfferTableAlertContent) ---
  const selectable = useMemo(
    () => new Set(filtered.filter((e) => e.items.length <= 1).map((e) => e.id)),
    [filtered]
  );
  const allSelected = selectable.size > 0 && selected.size === selectable.size &&
    [...selectable].every((id) => selected.has(id));

  const toggleOne = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(selectable));
    }
  }, [allSelected, selectable]);

  const clearSelection = useCallback(() => setSelected(new Set()), []);

  // Build export JSON — same format as ScreamDB: { "itemId": "title" }
  const exportJson = useMemo(() => {
    const map = new Map<string, string>();
    for (const el of filtered) {
      if (el.items.length > 1) continue;
      if (!selected.has(el.id)) continue;
      if (!map.has(el.id) || el.title) {
        map.set(el.id, el.title || "Unknown item");
      }
    }
    return Object.fromEntries(map);
  }, [filtered, selected]);

  const jsonString = useMemo(() => JSON.stringify(exportJson, null, 2), [exportJson]);

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
    } catch (e) {
      console.error("Failed to copy JSON", e);
    }
  }, [jsonString]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">
          Catalog offers
          <span className="ml-2 text-sm font-normal text-[var(--color-text-muted)]">
            ({filtered.length} of {offers.length})
          </span>
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <input
            className="input-compact min-w-[14rem]"
            placeholder="Search by title or ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {offerTypes.length > 0 && (
            <select
              className="input-compact"
              value={offerType}
              onChange={(e) => setOfferType(e.target.value)}
              title="Filter by offer type"
            >
              <option value="">All types</option>
              {offerTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Selection bar */}
      {selected.size > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-3 rounded-lg border border-[var(--color-accent-blue)]/20 bg-[var(--color-accent-blue)]/5 px-4 py-2 text-sm">
          <span className="text-[var(--color-text-muted)]">
            {selected.size} of {selectable.size} items selected
          </span>
          <button
            type="button"
            onClick={clearSelection}
            className="text-[var(--color-accent-blue)] hover:underline"
          >
            Clear selection
          </button>
          <button
            type="button"
            onClick={() => setShowJsonDialog(true)}
            className="btn-primary !py-1 !px-3 !text-xs"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0a1 1 0 0 1 .7.3l3 3a1 1 0 0 1-1.4 1.4L9 3.4V10a1 1 0 1 1-2 0V3.4L5.7 4.7a1 1 0 0 1-1.4-1.4l3-3A1 1 0 0 1 8 0ZM1 9h2a1 1 0 1 1 0 2H2v3h12v-3h-1a1 1 0 1 1 0-2h2a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H1a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1Z"/>
            </svg>
            Export as JSON
          </button>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState title="No offers found" hint="Try a different search or filter." />
      ) : (
        <>
          <div className="card !p-0 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead className="bg-[var(--color-bg-3)] text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
                <tr>
                  <th className="w-10 px-3 py-3">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      className="h-4 w-4 cursor-pointer accent-[var(--color-accent-blue)]"
                      title={allSelected ? "Deselect all" : "Select all"}
                    />
                  </th>
                  <th className="px-4 py-3 font-semibold">Image</th>
                  <th className="px-4 py-3 font-semibold">Item ID</th>
                  <th className="px-4 py-3 font-semibold">Title</th>
                  <th className="px-4 py-3 font-semibold">Offer type</th>
                  <th className="px-4 py-3 font-semibold">Created</th>
                  <th className="px-4 py-3 font-semibold">Price</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((o) => {
                  const rawUrl = pickOfferImageUrl(o.keyImages);
                  const imageUrl = rawUrl ? getResizedImageUrl({ url: rawUrl, w: 256, h: 144, q: 'medium' }) : null;
                  const itemIds = o.items.map((i) => i.id);
                  const isBundle = o.items.length > 1;
                  const canSelect = !isBundle;
                  const wasFree = isWasFree(o);
                  const priceVal = o.price?.price;
                  return (
                    <tr
                      key={o.id}
                      className={`border-b border-white/5 transition-colors hover:bg-white/5 ${selected.has(o.id) ? "bg-[var(--color-accent-blue)]/5" : ""}`}
                    >
                      <td className="px-3 py-3 align-middle">
                        <input
                          type="checkbox"
                          checked={selected.has(o.id)}
                          disabled={!canSelect}
                          onChange={() => toggleOne(o.id)}
                          className="h-4 w-4 cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 accent-[var(--color-accent-blue)]"
                          title={isBundle ? "Bundles cannot be exported" : "Select for JSON export"}
                        />
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="h-16 w-16 overflow-hidden rounded border border-white/10 bg-[var(--color-bg-3)]">
                          {imageUrl ? (
                            <Zoom isDisabled={!rawUrl} zoomImg={{ src: rawUrl ?? "" }}>
                              <img
                                src={imageUrl}
                                alt={o.title}
                                loading="lazy"
                                className="h-full w-full cursor-zoom-in object-cover"
                              />
                            </Zoom>
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[10px] text-[var(--color-text-muted)]">
                              —
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="space-y-1">
                          {itemIds.length === 0 ? (
                            <span className="text-xs text-[var(--color-text-muted)]">—</span>
                          ) : (
                            itemIds.map((id) => (
                              <CopyableItemId key={id} id={id} />
                            ))
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <span className="text-sm">{o.title}</span>
                        {wasFree && (
                          <span className="ml-2 inline-flex items-center rounded-full bg-[var(--color-accent)]/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-[var(--color-accent)]">
                            Was Free
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <span className="badge bg-[var(--color-accent-blue)]/15 text-[var(--color-accent-blue)]">
                          {o.offerType || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-top text-xs text-[var(--color-text-muted)] whitespace-nowrap">
                        {o.creationDate ? formatDate(o.creationDate) : "—"}
                      </td>
                      <td className="px-4 py-3 align-top text-sm">
                        {priceVal ? (
                          priceVal.originalPrice === 0 ? (
                            <span className="text-[var(--color-accent)] font-medium">Free</span>
                          ) : (
                            <span>
                              {formatPrice(priceVal.discountPrice)}
                              {priceVal.discountPrice < priceVal.originalPrice && (
                                <span className="ml-1.5 text-xs line-through text-[var(--color-text-muted)]">
                                  {formatPrice(priceVal.originalPrice)}
                                </span>
                              )}
                            </span>
                          )
                        ) : (
                          <span className="text-[var(--color-text-muted)]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {usePagination && (
            <div className="mt-4">
              <Pagination
                page={safePage}
                pageCount={pageCount}
                total={filtered.length}
                pageSize={OFFERS_PAGE_SIZE}
                onChange={setPage}
              />
            </div>
          )}
        </>
      )}

      {/* JSON export dialog */}
      {showJsonDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setShowJsonDialog(false)}>
          <div
            className="mx-4 flex max-h-[75vh] w-full max-w-2xl flex-col rounded-lg border border-white/10 bg-[var(--color-bg-2)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <h3 className="text-base font-semibold">Export JSON</h3>
              <button
                type="button"
                onClick={() => setShowJsonDialog(false)}
                className="text-[var(--color-text-muted)] hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <JsonViewer data={exportJson} defaultExpandedDepth={2} />
            </div>
            <div className="flex justify-end gap-2 border-t border-white/10 px-4 py-3">
              <button
                type="button"
                onClick={() => setShowJsonDialog(false)}
                className="btn-ghost !py-1.5 !px-4 !text-sm"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => { void copyToClipboard(); }}
                className="btn-outline !py-1.5 !px-4 !text-sm"
              >
                Copy to clipboard
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4">
        <Link to={routes.browse} className="btn-ghost !text-sm">
          ← Back to browse
        </Link>
      </div>
    </div>
  );
}

/** Format a price value (in cents) to a display string. */
function formatPrice(cents: number): string {
  if (cents === 0) return "Free";
  return `$${(cents / 100).toFixed(2)}`;
}
