/**
 * Hook that enriches the base-game offer with egdata data:
 *  - Features (DRM, cloud save, multiplayer, etc.)
 *
 * Fetches only for the primary game offer (the first BASE_GAME), not every
 * offer in the table.  Results are cached by offerId via react-query.
 */

import { useQuery } from "@tanstack/react-query";
import {
  fetchOfferFeatures,
  type OfferFeature,
} from "~/api/egdata";

export interface EgdataEnrichment {
  features: OfferFeature[];
}

/**
 * Find the first BASE_GAME offer's ID to query egdata.
 * Falls back to the first offer with exactly 1 item.
 */
export function pickBaseGameOfferId(offers: { id: string; offerType: string; items: { id: string }[] }[]): string | null {
  const base = offers.find((o) => o.offerType === "BASE_GAME" && o.items.length === 1);
  if (base) return base.id;
  const fallback = offers.find((o) => o.items.length === 1);
  return fallback?.id ?? null;
}

export function useEgdataEnrichment(offerId: string | null) {
  const features = useQuery({
    queryKey: ["egdataFeatures", offerId],
    queryFn: () => fetchOfferFeatures(offerId!),
    enabled: Boolean(offerId),
    staleTime: 10 * 60 * 1000, // 10 min
    retry: 1,
  });

  return {
    features: features.data ?? [],
    featuresLoading: features.isLoading,
    featuresError: features.error,
  };
}
