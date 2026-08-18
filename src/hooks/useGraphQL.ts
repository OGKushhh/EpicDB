/**
 * GraphQL hooks — wraps executeGraphQL for the GraphQL Browser page.
 *
 * The GraphQL page lets users type arbitrary queries + variables, so we use
 * a manual `useMutation` rather than `useQuery` (no fixed query key + query).
 */

import { useMutation } from "@tanstack/react-query";

import { executeGraphQL } from "~/api/graphql";
import type { GraphQLResponse, GraphQLVariables } from "~/types/graphql";

export interface RunGraphQLArgs {
  query: string;
  variables: GraphQLVariables;
  operationName?: string;
}

export interface RunGraphQLResult<TData = unknown> {
  response: GraphQLResponse<TData>;
  /** Wall-clock time in milliseconds for the request. */
  durationMs: number;
}

export function useRunGraphQL() {
  return useMutation<RunGraphQLResult, Error, RunGraphQLArgs>({
    mutationFn: async ({ query, variables, operationName }) => {
      const started = performance.now();
      const response = await executeGraphQL<unknown>(query, variables, operationName);
      const durationMs = Math.round(performance.now() - started);
      return { response, durationMs };
    },
  });
}
