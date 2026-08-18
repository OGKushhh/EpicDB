import { useCallback } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";

const DEFAULT_QUERY = `# Epic Games GraphQL — sample query
# Try the searchStore query to find games in the catalog.
query searchStore($keywords: String!, $count: Int!) {
  Catalog {
    searchStore(
      category: "games/edition/base"
      count: $count
      keywords: $keywords
    ) {
      elements {
        id
        title
        namespace
        creationDate
        items { id namespace }
      }
      paging { count total }
    }
  }
}`;

/** Monaco-based GraphQL query editor. */
export function QueryEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const onMount = useCallback<OnMount>((editor) => {
    editor.focus();
  }, []);

  return (
    <div className="overflow-hidden rounded-md border border-white/10">
      <Editor
        height="260px"
        defaultLanguage="graphql"
        value={value || DEFAULT_QUERY}
        onChange={(v) => onChange(v ?? "")}
        onMount={onMount}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 13,
          fontFamily: "Fira Code Variable, monospace",
          fontLigatures: true,
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          tabSize: 2,
          wordWrap: "on",
          automaticLayout: true,
        }}
      />
    </div>
  );
}

/** JSON textarea for variables — free-form, validated on run. */
export function VariablesEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
        Variables (JSON)
      </label>
      <textarea
        className="input mono h-24 w-full resize-y"
        spellCheck={false}
        placeholder={'{\n  "keywords": "fortnite",\n  "count": 5\n}'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
