import { useState } from "react";
import { JsonViewer } from "~/components/JsonViewer";
import type { GraphQLResponse, GraphQLError } from "~/types/graphql";

/** Right-side results panel — shows JSON tree, errors, copy buttons, timing. */
export function ResultsDisplay({
  response,
  errors,
  durationMs,
  onCopy,
}: {
  response: GraphQLResponse | null;
  errors: GraphQLError[] | null;
  durationMs: number | null;
  onCopy: (text: string) => void;
}) {
  const [tab, setTab] = useState<"data" | "errors" | "raw">("data");

  if (!response && !errors) {
    return (
      <div className="card flex h-full min-h-[200px] items-center justify-center text-sm text-[var(--color-text-muted)]">
        Run a query to see results here.
      </div>
    );
  }

  const hasErrors = errors && errors.length > 0;
  const hasData = response?.data !== undefined;
  const rawJson = JSON.stringify({ ...response, errors: errors ?? undefined }, null, 2);

  return (
    <div className="card flex h-full flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-2">
        <div className="flex items-center gap-1">
          <TabBtn label="Data" active={tab === "data"} onClick={() => setTab("data")} disabled={!hasData} />
          <TabBtn
            label={`Errors${hasErrors ? ` (${errors!.length})` : ""}`}
            active={tab === "errors"}
            onClick={() => setTab("errors")}
            disabled={!hasErrors}
          />
          <TabBtn label="Raw" active={tab === "raw"} onClick={() => setTab("raw")} />
        </div>
        <div className="ml-auto flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
          {durationMs !== null && <span>⌛ {durationMs} ms</span>}
          <button
            type="button"
            onClick={() => onCopy(rawJson)}
            className="btn-ghost"
            title="Copy raw response"
          >
            ⧉ Copy
          </button>
        </div>
      </div>

      <div className="min-h-[200px] flex-1 overflow-auto">
        {tab === "data" && hasData && (
          <JsonViewer data={response?.data} defaultExpandedDepth={2} />
        )}
        {tab === "data" && !hasData && (
          <div className="text-sm text-[var(--color-text-muted)]">
            Response had no <code>data</code> field.
          </div>
        )}
        {tab === "errors" && hasErrors && (
          <ul className="space-y-2 text-sm">
            {errors!.map((e, i) => (
              <li
                key={i}
                className="rounded-md border border-red-500/40 bg-red-500/10 p-2 text-red-200"
              >
                <div className="mono text-xs">{e.message}</div>
                {e.locations && (
                  <div className="mono text-[10px] text-red-300/80 mt-1">
                    at line {e.locations[0]?.line}, col {e.locations[0]?.column}
                  </div>
                )}
                {e.path && (
                  <div className="mono text-[10px] text-red-300/80">
                    path: {e.path.join(".")}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
        {tab === "errors" && !hasErrors && (
          <div className="text-sm text-[var(--color-text-muted)]">No errors.</div>
        )}
        {tab === "raw" && (
          <pre className="mono text-xs whitespace-pre-wrap">{rawJson}</pre>
        )}
      </div>
    </div>
  );
}

function TabBtn({
  label,
  active,
  onClick,
  disabled,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
        active
          ? "bg-white/10 text-[var(--color-text)]"
          : "text-[var(--color-text-muted)] hover:bg-white/5"
      } ${disabled ? "cursor-not-allowed opacity-40" : ""}`}
    >
      {label}
    </button>
  );
}
