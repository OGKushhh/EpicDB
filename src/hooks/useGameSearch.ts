/**
 * Game-browse hook — wraps the searchStore GraphQL query for the Browse page.
 * Uses useQuery so the result is cached per (keywords, page, sort, perPage) tuple.
 */

import { useQuery } from "@tanstack/react-query";
import { searchStore, KEY_IMAGE_TYPES, type SearchStoreElement } from "~/api/graphql";
import { getResizedImageUrl } from "~/utils/imageResize";

export interface GameCardData {
  id: string;
  title: string;
  namespace: string;
  imageUrl: string | null;
  creationDate: Date;
  releaseDate: Date | null;
}

export interface UseGameSearchArgs {
  keywords: string;
  page: number;
  pageSize: number;
  sortBy: string;
  sortDir: string;
}

export function useGameSearch(args: UseGameSearchArgs) {
  return useQuery({
    queryKey: [
      "searchStore",
      args.keywords,
      args.page,
      args.pageSize,
      args.sortBy,
      args.sortDir,
    ],
    queryFn: async () => {
      const result = await searchStore({
        keywords: args.keywords,
        count: args.pageSize,
        start: args.pageSize * args.page,
        sortBy: args.sortBy,
        sortDir: args.sortDir,
      });
      const cards: GameCardData[] = result.elements.map((el) =>
        elementToCard(el)
      );
      return { cards, total: result.total };
    },
    placeholderData: (prev) => prev,
  });
}

/** Pick the best available thumbnail image URL from a searchStore element. */
function elementToCard(el: SearchStoreElement): GameCardData {
  const images = el.keyImages ?? [];
  const tall = images.find((i) => i.type === KEY_IMAGE_TYPES.OFFER_IMAGE_TALL);
  const wide = images.find((i) => i.type === KEY_IMAGE_TYPES.OFFER_IMAGE_WIDE);
  const dell = images.find((i) => i.type === KEY_IMAGE_TYPES.DELL_IMAGE);
  const thumb = images.find((i) => i.type === KEY_IMAGE_TYPES.THUMBNAIL);
  const rawUrl = (tall ?? wide ?? dell ?? thumb)?.url ?? null;
  // Request a smaller, medium-quality copy from Epic's CDN — much faster
  // to load on the Browse grid.  ScreamDB uses the same approach (w:360 h:480).
  const imageUrl = rawUrl ? getResizedImageUrl({ url: rawUrl, w: 360, h: 480, q: 'medium' }) : null;
  return {
    id: el.id,
    title: el.title,
    namespace: el.namespace,
    imageUrl,
    creationDate: new Date(el.creationDate),
    releaseDate: el.releaseDate ? new Date(el.releaseDate) : null,
  };
}
