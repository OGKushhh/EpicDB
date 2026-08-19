/**
 * egdata.app REST API client — public, no auth, CORS-friendly.
 * Used to enrich the Game Offers page with features (DRM flags).
 */

const EGDATA_BASE = "https://api.egdata.app";

/** Feature flag returned by /offers/{id}/features */
export interface OfferFeature {
  name: string;
  value: string | boolean | number;
}

/** Fetch feature flags for an offer (DRM, cloud save, etc.). */
export async function fetchOfferFeatures(
  offerId: string
): Promise<OfferFeature[]> {
  const res = await fetch(`${EGDATA_BASE}/offers/${offerId}/features`);
  if (!res.ok) throw new Error(`egdata features: ${res.status}`);
  return res.json();
}
