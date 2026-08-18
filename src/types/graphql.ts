/**
 * Type definitions for the Epic Games GraphQL API used by the Browse page.
 *
 * The Epic Games launcher uses a GraphQL endpoint at
 * https://graphql.epicgames.com/ue/graphql. Browsers cannot call this endpoint
 * directly because of CORS and a User-Agent whitelist, so requests go through
 * a Cloudflare CORS proxy (set via VITE_EPIC_GRAPHQL_ENDPOINT).
 */

/** Variables are a free-form JSON object. */
export type GraphQLVariables = Record<string, unknown>;

/** A GraphQL request envelope sent to the endpoint. */
export interface GraphQLRequestEnvelope {
  query: string;
  variables?: GraphQLVariables;
  operationName?: string;
}

/** Errors returned in a GraphQL response (errors[] array). */
export interface GraphQLError {
  message: string;
  locations?: Array<{ line: number; column: number }>;
  path?: Array<string | number>;
  extensions?: Record<string, unknown>;
}

/** Full GraphQL response shape. */
export interface GraphQLResponse<TData = unknown> {
  data?: TData;
  errors?: GraphQLError[];
  extensions?: Record<string, unknown>;
}
