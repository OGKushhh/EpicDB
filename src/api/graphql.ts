/**
 * Epic Games GraphQL client — talks to Epic's GraphQL endpoint via a CORS
 * proxy (default proxy is the public Cloudflare worker used by the previous
 * EpicDB release). The proxy URL is set via VITE_EPIC_GRAPHQL_ENDPOINT.
 *
 * The browser cannot call https://graphql.epicgames.com/ue/graphql directly
 * because (a) CORS and (b) the endpoint has a User-Agent whitelist that
 * cannot be set from browser JS. The proxy injects the correct User-Agent
 * and returns `Access-Control-Allow-Origin: *`.
 */

import type {
  GraphQLError,
  GraphQLRequestEnvelope,
  GraphQLResponse,
  GraphQLVariables,
} from "~/types/graphql";

/** Base URL of the Epic GraphQL proxy, no trailing slash. */
const GRAPHQL_ENDPOINT = (import.meta.env.VITE_EPIC_GRAPHQL_ENDPOINT ?? "").replace(
  /\/+$/,
  ""
);

if (!GRAPHQL_ENDPOINT) {
  // eslint-disable-next-line no-console
  console.warn(
    "[EpicDB] VITE_EPIC_GRAPHQL_ENDPOINT is not set — GraphQL queries will fail.",
    "Set it in .env (see .env.example)."
  );
}

export const GRAPHQL_CONFIG = { endpoint: GRAPHQL_ENDPOINT } as const;

/** Structured error thrown by the GraphQL client. */
export class GraphQLClientError extends Error {
  status: number;
  graphQLErrors?: GraphQLError[];

  constructor(
    status: number,
    message: string,
    graphQLErrors?: GraphQLError[]
  ) {
    super(message);
    this.name = "GraphQLClientError";
    this.status = status;
    this.graphQLErrors = graphQLErrors;
  }
}

/**
 * Execute a GraphQL query against the Epic endpoint via the configured proxy.
 * Returns `{ data, errors }` per the GraphQL spec.
 */
export async function executeGraphQL<TData = unknown>(
  query: string,
  variables: GraphQLVariables = {},
  operationName?: string
): Promise<GraphQLResponse<TData>> {
  if (!GRAPHQL_ENDPOINT) {
    throw new GraphQLClientError(
      0,
      "VITE_EPIC_GRAPHQL_ENDPOINT is not set. Configure it in .env."
    );
  }

  const envelope: GraphQLRequestEnvelope = { query, variables };
  if (operationName) envelope.operationName = operationName;

  let res: Response;
  try {
    res = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(envelope),
    });
  } catch (err) {
    throw new GraphQLClientError(
      0,
      `Network error reaching GraphQL endpoint: ${(err as Error).message}`
    );
  }

  const text = await res.text();
  let payload: GraphQLResponse<TData> | null = null;

  if (text) {
    try {
      payload = JSON.parse(text) as GraphQLResponse<TData>;
    } catch {
      throw new GraphQLClientError(
        res.status,
        `GraphQL endpoint returned non-JSON response (status ${res.status}).`
      );
    }
  }

  if (!res.ok) {
    const errs = payload?.errors;
    throw new GraphQLClientError(
      res.status,
      errs?.length ? errs.map((e) => e.message).join("; ") : `HTTP ${res.status}`,
      errs
    );
  }

  return payload ?? { data: undefined, errors: undefined };
}

/**
 * The `searchStore` GraphQL query — fetches a page of games from the Epic
 * Games Store catalog. Mirrors the query used by the ScreamDB project.
 *
 * Variables:
 *   - count:    page size (Epic caps at 1000)
 *   - keywords: free-text search query ("" returns all games)
 *   - sortBy:   "relevancy" | "title" | "creationDate" | "releaseDate" |
 *               "pcReleaseDate" | "currentPrice"
 *   - sortDir:  "ASC" | "DESC"
 *   - start:    0-indexed offset (start = count * page)
 */
export const SEARCH_STORE_QUERY = /* GraphQL */ `
query searchStore($count: Int!, $keywords: String!, $sortBy: String, $sortDir: String, $start: Int) {
  Catalog {
    searchStore(
      category: "games/edition/base"
      count: $count
      keywords: $keywords
      sortBy: $sortBy
      sortDir: $sortDir
      start: $start
    ) {
      elements {
        id
        title
        namespace
        creationDate
        releaseDate
        keyImages {
          type
          url
        }
        items {
          id
          namespace
        }
      }
      paging {
        total
      }
    }
  }
}
`;

/** Image types we look for when picking a card thumbnail. */
export const KEY_IMAGE_TYPES = {
  OFFER_IMAGE_TALL: "OfferImageTall",
  OFFER_IMAGE_WIDE: "OfferImageWide",
  DELL_IMAGE: "DellImage",
  THUMBNAIL: "Thumbnail",
} as const;

/** Run the searchStore query and return the parsed response. */
export async function searchStore(args: {
  keywords: string;
  count: number;
  start: number;
  sortBy?: string;
  sortDir?: string;
}): Promise<SearchStoreResult> {
  const response = await executeGraphQL<SearchStoreData>(SEARCH_STORE_QUERY, {
    count: args.count,
    keywords: args.keywords,
    sortBy: args.sortBy,
    sortDir: args.sortDir,
    start: args.start,
  });
  if (response.errors?.length) {
    throw new GraphQLClientError(
      0,
      response.errors.map((e) => e.message).join("; "),
      response.errors
    );
  }
  const searchStore = response.data?.Catalog?.searchStore;
  if (!searchStore) {
    throw new GraphQLClientError(0, "No searchStore data in response");
  }
  return {
    elements: searchStore.elements ?? [],
    total: searchStore.paging?.total ?? 0,
  };
}

export interface SearchStoreElement {
  id: string;
  title: string;
  namespace: string;
  creationDate: string;
  releaseDate?: string | null;
  keyImages?: Array<{ type: string; url: string }>;
  items?: Array<{ id: string; namespace: string }>;
}

export interface SearchStoreResult {
  elements: SearchStoreElement[];
  total: number;
}

interface SearchStoreData {
  Catalog?: {
    searchStore?: {
      elements?: SearchStoreElement[];
      paging?: { total: number };
    };
  };
}

/**
 * The `searchGameOffers` query — fetches ALL catalog offers for a single game
 * namespace, plus the game's main info (title, description, keyImages, page slug).
 * Mirrors the query used by the ScreamDB project's game-offers page.
 */
export const SEARCH_GAME_OFFERS_QUERY = /* GraphQL */ `
query searchGameOffers($namespace: String!) {
  Catalog {
    catalogOffers(namespace: $namespace, params: { count: 1000 }) {
      elements {
        id
        title
        offerType
        items {
          id
        }
        keyImages {
          type
          url
        }
      }
    }
    searchStore(category: "games/edition/base", namespace: $namespace) {
      elements {
        id
        title
        description
        namespace
        keyImages {
          type
          url
        }
        catalogNs {
          mappings(pageType: "productHome") {
            pageSlug
          }
        }
      }
    }
  }
}
`;

export interface OfferItem {
  id: string;
}

export interface OfferElement {
  id: string;
  title: string;
  offerType: string;
  items: OfferItem[];
  keyImages?: Array<{ type: string; url: string }>;
}

export interface GameInfo {
  id: string;
  title: string;
  description: string | null;
  namespace: string;
  keyImages?: Array<{ type: string; url: string }>;
  catalogNs?: {
    mappings?: Array<{ pageSlug: string }>;
  };
}

export interface GameOffersResult {
  game: GameInfo | null;
  offers: OfferElement[];
}

/** Run searchGameOffers — returns the game info + all its catalog offers. */
export async function searchGameOffers(namespace: string): Promise<GameOffersResult> {
  const response = await executeGraphQL<SearchGameOffersData>(
    SEARCH_GAME_OFFERS_QUERY,
    { namespace }
  );
  if (response.errors?.length) {
    throw new GraphQLClientError(
      0,
      response.errors.map((e) => e.message).join("; "),
      response.errors
    );
  }
  const cat = response.data?.Catalog;
  const offers = cat?.catalogOffers?.elements ?? [];
  const game = cat?.searchStore?.elements?.[0] ?? null;
  return { game, offers };
}

interface SearchGameOffersData {
  Catalog?: {
    catalogOffers?: { elements?: OfferElement[] };
    searchStore?: { elements?: GameInfo[] };
  };
}
