/**
 * egdata.app REST API client — public, no auth, CORS-friendly.
 * Used to enrich the Game Offers page with features (DRM flags) and
 * price-stats (historical pricing / "was free" detection).
 */

const EGDATA_BASE = "https://api.egdata.app";

/** Feature flag returned by /offers/{id}/features */
export interface OfferFeature {
  name: string;
  value: string | boolean | number;
}

/** Price stats returned by /offers/{id}/price-stats */
export interface PriceStats {
  current?: { price: number; discount: number };
  lowest?: { price: number; date: string; discount: number };
  lastDiscount?: { price: number; date: string; discount: number };
}

/** Fetch feature flags for an offer (DRM, cloud save, etc.). */
export async function fetchOfferFeatures(
  offerId: string
): Promise<OfferFeature[]> {
  const res = await fetch(`${EGDATA_BASE}/offers/${offerId}/features`);
  if (!res.ok) throw new Error(`egdata features: ${res.status}`);
  return res.json();
}

/** Fetch price stats for an offer (current / lowest-ever / last discount). */
export async function fetchOfferPriceStats(
  offerId: string
): Promise<PriceStats> {
  const res = await fetch(`${EGDATA_BASE}/offers/${offerId}/price-stats`);
  if (!res.ok) throw new Error(`egdata price-stats: ${res.status}`);
  return res.json();
}
