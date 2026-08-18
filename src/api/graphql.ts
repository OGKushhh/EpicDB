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
