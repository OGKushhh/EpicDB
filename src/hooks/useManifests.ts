/**
 * TanStack Query hooks for the manifest backend. Wraps the manifest API client
 * in queries so the UI gets caching, refetching, loading, and error states
 * for free.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  cleanupManifests,
  fetchInfo,
  fetchList,
  fetchStats,
  fetchTitles,
  rebuildIndex,
} from "~/api/manifest";
import type { ListResponse, ManifestInfoEntry, StatsResponse, TitlesResponse } from "~/types/manifest";

export const manifestKeys = {
  all: ["manifest"] as const,
  titles: () => [...manifestKeys.all, "titles"] as const,
  stats: () => [...manifestKeys.all, "stats"] as const,
  list: () => [...manifestKeys.all, "list"] as const,
  info: (appName: string, effectiveId: string) =>
    [...manifestKeys.all, "info", appName, effectiveId] as const,
} as const;

/** GET /titles — list of all games. */
export function useTitles() {
  return useQuery<TitlesResponse>({
    queryKey: manifestKeys.titles(),
    queryFn: fetchTitles,
    staleTime: 30_000,
  });
}

/** GET /stats — DB statistics. */
export function useStats() {
  return useQuery<StatsResponse>({
    queryKey: manifestKeys.stats(),
    queryFn: fetchStats,
    staleTime: 30_000,
  });
}

/** GET /list — tree of app_name → .manifest filenames. */
export function useList() {
  return useQuery<ListResponse>({
    queryKey: manifestKeys.list(),
    queryFn: fetchList,
    staleTime: 60_000,
  });
}

/** GET /info/<app>/<effective_id> — full metadata for one manifest. */
export function useInfo(appName: string | null, effectiveId: string | null) {
  return useQuery<ManifestInfoEntry>({
    queryKey: manifestKeys.info(appName ?? "", effectiveId ?? ""),
    queryFn: () => {
      if (!appName || !effectiveId) {
        throw new Error("appName and effectiveId are required");
      }
      return fetchInfo(appName, effectiveId);
    },
    enabled: Boolean(appName && effectiveId),
  });
}

/** POST /cleanup — remove stale entries (>24h, build_id empty/"unknown"). */
export function useCleanupManifests() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dryRun: boolean) => cleanupManifests(dryRun),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: manifestKeys.all });
    },
  });
}

/** POST /rebuild — rebuild index.json from the filesystem. */
export function useRebuildIndex() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => rebuildIndex(),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: manifestKeys.all });
    },
  });
}

