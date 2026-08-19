import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router";
import { useGameOffers, pickOfferImageUrl } from "~/hooks/useGameOffers";
import type { OfferElement, GameInfo } from "~/api/graphql";
import { routes } from "~/components/Header";
import { ErrorBlock, LoadingFallback, EmptyState } from "~/components/Loading";
import { Pagination } from "~/components/Pagination";

/** Below this many offers, we don't bother showing pagination — just render
 *  all rows. Above the threshold, paginate (10 per page). */
const OFFERS_PAGINATION_THRESHOLD = 10;
const OFFERS_PAGE_SIZE = 10;

/**
 * Game detail page — standalone route at /browse/:namespace. Mirrors the
 * ScreamDB game-offers page layout: hero image + game info (title, namespace,
 * description) on top, then a searchable/filterable table of catalog offers
 * (image, item ID, title, offer type).
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
  return (
    <div className="mx-auto max-w-7xl px-6 py-6">
      {/* Top: banner + info */}
      <div className="mb-6 flex flex-col gap-6 sm:flex-row">
        <div className="shrink-0">
          <div className="aspect-[16/9] w-80 overflow-hidden rounded-lg border border-white/10 bg-[var(--color-base-3)]">
            {pickBannerUrl(game.keyImages) ? (
              <img
                src={pickBannerUrl(game.keyImages) ?? ""}
                alt={game.title}
                className="h-full w-full object-cover"
              />
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
          <InfoRow label="Namespace" value={game.namespace} mono />
          <InfoRow label="Item ID" value={game.id} mono />
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

      {/* Bottom: offers table with search + filters */}
      <OffersTable offers={offers} />
    </div>
  );
}

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
      <div className="w-28 shrink-0 text-[var(--color-text-muted)]">{label}</div>
      <code className={`flex-1 break-all ${mono ? "mono" : ""}`}>{value}</code>
    </div>
  );
}

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

/** Offers table with search + offer-type filter + pagination when above threshold. */
function OffersTable({ offers }: { offers: OfferElement[] }) {
  const [search, setSearch] = useState("");
  const [offerType, setOfferType] = useState<string>("");
  const [page, setPage] = useState(0);

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

      {filtered.length === 0 ? (
        <EmptyState title="No offers found" hint="Try a different search or filter." />
      ) : (
        <>
          <div className="card !p-0 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left">
              <thead className="bg-[var(--color-base-3)] text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Image</th>
                  <th className="px-4 py-3 font-semibold">Item ID</th>
                  <th className="px-4 py-3 font-semibold">Title</th>
                  <th className="px-4 py-3 font-semibold">Offer type</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((o) => {
                  const imageUrl = pickOfferImageUrl(o.keyImages);
                  const itemIds = o.items.map((i) => i.id);
                  return (
                    <tr
                      key={o.id}
                      className="border-b border-white/5 transition-colors hover:bg-white/5"
                    >
                      <td className="px-4 py-3 align-top">
                        <div className="h-16 w-16 overflow-hidden rounded border border-white/10 bg-[var(--color-base-3)]">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={o.title}
                              loading="lazy"
                              className="h-full w-full object-cover"
                            />
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
                              <div key={id} className="mono text-xs break-all">
                                {id}
                              </div>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top text-sm">{o.title}</td>
                      <td className="px-4 py-3 align-top">
                        <span className="badge bg-[var(--color-accent-blue)]/15 text-[var(--color-accent-blue)]">
                          {o.offerType || "—"}
                        </span>
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

      <div className="mt-4">
        <Link to={routes.browse} className="btn-ghost !text-sm">
          ← Back to browse
        </Link>
      </div>
    </div>
  );
}
