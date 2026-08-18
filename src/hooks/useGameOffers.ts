/**
 * Game-offers hook — wraps the searchGameOffers GraphQL query for the game
 * detail page. Cached per namespace so back-navigation is instant.
 */

import { useQuery } from "@tanstack/react-query";
import { searchGameOffers, type OfferElement } from "~/api/graphql";

export type { OfferElement };

export function useGameOffers(namespace: string) {
  return useQuery({
    queryKey: ["gameOffers", namespace],
    queryFn: () => searchGameOffers(namespace),
    enabled: Boolean(namespace),
  });
}

/** Pick the best thumbnail URL from an offer's keyImages array. */
export function pickOfferImageUrl(
  keyImages?: Array<{ type: string; url: string }>
): string | null {
  if (!keyImages?.length) return null;
  const preferred = [
    "OfferImageTall",
    "OfferImageWide",
    "DellImage",
    "Thumbnail",
    "DieselStoreFrontTall",
    "DieselStoreFrontWide",
  ];
  for (const type of preferred) {
    const found = keyImages.find((k) => k.type === type);
    if (found) return found.url;
  }
  return keyImages[0].url;
}
