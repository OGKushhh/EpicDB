import { useCallback, useState } from "react";
import { useRunGraphQL } from "~/hooks/useGraphQL";
import { addHistoryEntry, clearHistory, loadHistory } from "~/components/GraphQL/storage";
import { QueryEditor, VariablesEditor } from "~/components/GraphQL/QueryEditor";
import { SavedQueries, useSavedQueries } from "~/components/GraphQL/SavedQueries";
import { QueryHistory } from "~/components/GraphQL/QueryHistory";
import { ResultsDisplay } from "~/components/GraphQL/ResultsDisplay";
import type { GraphQLError, GraphQLResponse, QueryHistoryEntry } from "~/types/graphql";

/**
 * GraphQL Browser page — Monaco editor + variables + run button, with saved
 * queries (localStorage) and recent history. Calls the Epic GraphQL endpoint
 * via the configured CORS proxy.
 */
export function GraphQLPage() {
  const [query, setQuery] = useState("");
  const [variables, setVariables] = useState("");
  const [history, setHistory] = useState<QueryHistoryEntry[]>(() => loadHistory());
  const [savedName, setSavedName] = useState("");

  const runQuery = useRunGraphQL();
  const saved = useSavedQueries();

  const [response, setResponse] = useState<GraphQLResponse | null>(null);
  const [errors, setErrors] = useState<GraphQLError[] | null>(null);
  const [durationMs, setDurationMs] = useState<number | null>(null);

  const onRun = useCallback(() => {
    let vars: Record<string, unknown> = {};
    const trimmedVars = variables.trim();
    if (trimmedVars) {
      try {
        vars = JSON.parse(trimmedVars) as Record<string, unknown>;
      } catch (err) {
        setResponse(null);
        setErrors([{ message: `Invalid JSON variables: ${(err as Error).message}` }]);
        setDurationMs(null);
        return;
      }
    }
    runQuery.mutate(
      { query, variables: vars },
      {
        onSuccess: ({ response, durationMs }) => {
          setResponse(response);
          setErrors(response.errors ?? null);
          setDurationMs(durationMs);
          addHistoryEntry(query, variables, !response.errors?.length);
          setHistory(loadHistory());
        },
        onError: (err: Error) => {
          setResponse(null);
          setErrors([{ message: err.message }]);
          setDurationMs(null);
          addHistoryEntry(query, variables, false);
          setHistory(loadHistory());
        },
      }
    );
  }, [query, variables, runQuery]);

  const onCopy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("clipboard write failed:", err);
    }
  }, []);

  const onLoadSaved = useCallback(
    (q: { query: string; variables: string; name?: string }) => {
      setQuery(q.query);
      setVariables(q.variables);
      if (q.name) setSavedName(q.name);
    },
    []
  );

  const onSaveCurrent = useCallback(() => {
    const name = savedName.trim() || `Query ${new Date().toLocaleString()}`;
    saved.add(name, query, variables);
  }, [saved, savedName, query, variables]);

  const onClearHistory = useCallback(() => {
    clearHistory();
    setHistory([]);
  }, []);

  const loading = runQuery.isPending;

  return (
    <div className="mx-auto max-w-7xl px-4 py-4">
      <header className="mb-4">
        <h1 className="text-xl font-semibold">GraphQL Browser</h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          Run GraphQL queries against the Epic Games catalog. Uses a CORS proxy
          configured via <code>VITE_EPIC_GRAPHQL_ENDPOINT</code>.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_18rem]">
        {/* Left column — editor + results */}
        <div className="flex flex-col gap-3">
          <div className="card">
            <QueryEditor value={query} onChange={setQuery} />
          </div>
          <div className="card flex flex-col gap-3">
            <VariablesEditor value={variables} onChange={setVariables} />
            <div className="flex flex-wrap items-center gap-2 border-t border-white/10 pt-3">
              <button
                onClick={onRun}
                disabled={loading || !query.trim()}
                className="btn-primary"
              >
                {loading ? "Running…" : "▶ Run"}
              </button>
              <button
                onClick={onSaveCurrent}
                disabled={!query.trim()}
                className="btn-outline"
              >
                ★ Save
              </button>
              <button
                onClick={() => onCopy(query)}
                disabled={!query.trim()}
                className="btn-ghost"
              >
                ⧉ Copy query
              </button>
              <input
                className="input ml-auto min-w-[12rem]"
                placeholder="Name to save this query as…"
                value={savedName}
                onChange={(e) => setSavedName(e.target.value)}
              />
            </div>
          </div>
          <ResultsDisplay
            response={response}
            errors={errors}
            durationMs={durationMs}
            onCopy={onCopy}
          />
        </div>

        {/* Right column — saved + history */}
        <aside className="flex flex-col gap-3">
          <div>
            <div className="mb-1 text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
              Saved Queries
            </div>
            <SavedQueries
              list={saved.list}
              onLoad={onLoadSaved}
              onDelete={saved.remove}
            />
          </div>
          <div>
            <QueryHistory
              history={history}
              onLoad={onLoadSaved}
              onClear={onClearHistory}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
