import { type ReactNode, useCallback, useState } from "react";

/** A collapsible JSON viewer. Renders any value as a tree with toggle arrows. */
export function JsonViewer({
  data,
  defaultExpandedDepth = 1,
  className = "",
}: {
  data: unknown;
  defaultExpandedDepth?: number;
  className?: string;
}) {
  return (
    <div className={`mono text-xs leading-relaxed [overflow-wrap:anywhere] ${className}`}>
      <JsonNode
        value={data}
        name={null}
        depth={0}
        defaultExpandedDepth={defaultExpandedDepth}
      />
    </div>
  );
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isArray(v: unknown): v is unknown[] {
  return Array.isArray(v);
}

function JsonNode({
  value,
  name,
  depth,
  defaultExpandedDepth,
}: {
  value: unknown;
  name: ReactNode | null;
  depth: number;
  defaultExpandedDepth: number;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const toggle = useCallback(() => setIsOpen((o) => !o), []);

  const hasChildren = isObject(value) || isArray(value);
  const childCount = isArray(value)
    ? value.length
    : isObject(value)
      ? Object.keys(value).length
      : 0;

  // Leaf rendering
  if (!hasChildren) {
    return (
      <div className="flex flex-wrap gap-x-1 py-0.5 pl-0">
        {name !== null && <span className="text-[var(--color-accent)]">{name}:</span>}
        <span className={leafClass(value)}>{formatLeaf(value)}</span>
      </div>
    );
  }

  // Object/array rendering with toggle
  const open = isOpen || depth < defaultExpandedDepth;
  const opener = open ? "▼" : "▶";
  const kindLabel = isArray(value) ? `Array(${childCount})` : `{${childCount}}`;

  return (
    <div className="py-0.5">
      <button
        type="button"
        onClick={toggle}
        className="inline-flex items-center gap-1 text-left hover:bg-white/5"
      >
        <span className="w-3 text-[var(--color-text-muted)]">{opener}</span>
        {name !== null && (
          <span className="text-[var(--color-accent)]">{name}:</span>
        )}
        <span className="text-[var(--color-text-muted)]">{kindLabel}</span>
      </button>
      {open && (
        <div className="ml-3 border-l border-white/10 pl-3">
          {isArray(value)
            ? value.map((v, i) => (
                <JsonNode
                  key={i}
                  value={v}
                  name={String(i)}
                  depth={depth + 1}
                  defaultExpandedDepth={defaultExpandedDepth}
                />
              ))
            : Object.entries(value).map(([k, v]) => (
                <JsonNode
                  key={k}
                  value={v}
                  name={k}
                  depth={depth + 1}
                  defaultExpandedDepth={defaultExpandedDepth}
                />
              ))}
        </div>
      )}
    </div>
  );
}

function leafClass(v: unknown): string {
  switch (typeof v) {
    case "string":
      return "text-emerald-300";
    case "number":
      return "text-blue-300";
    case "boolean":
      return "text-amber-300";
    case "object":
      return v === null ? "text-[var(--color-text-muted)]" : "text-pink-300";
    default:
      return "text-[var(--color-text-muted)]";
  }
}

function formatLeaf(v: unknown): string {
  if (v === null) return "null";
  if (typeof v === "string") return JSON.stringify(v);
  return String(v);
}
