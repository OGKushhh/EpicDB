import { isSha1Fallback, type ManifestTitleEntry, type ManifestTitleGroup } from "~/types/manifest";

/** A row in the games table — shows effective_id with fallback hint when applicable. */
function EntryRow({
  entry,
  appName,
  onSelect,
  selected,
}: {
  entry: ManifestTitleEntry;
  appName: string;
  onSelect: (e: ManifestTitleEntry) => void;
  selected: boolean;
}) {
  const fallback = isSha1Fallback(entry);
  return (
    <tr
      onClick={() => onSelect(entry)}
      className={`cursor-pointer border-b border-white/5 transition-colors hover:bg-white/5 ${
        selected ? "bg-[var(--color-accent)]/10" : ""
      }`}
    >
      <td className="px-3 py-2 align-top">
        <div className="flex items-center gap-2">
          <span
            className={`mono text-xs ${fallback ? "italic text-[var(--color-text-muted)]" : ""}`}
            title={
              fallback
                ? `SHA1 fallback — old binary manifest (DataVersion 0). Original build_id was empty/"unknown".`
                : undefined
            }
          >
            {entry.effective_id}
          </span>
          {fallback && (
            <span className="badge bg-amber-500/20 text-amber-300" title="SHA1 fallback">
              fallback
            </span>
          )}
        </div>
      </td>
      <td className="px-3 py-2 align-top">
        <span
          className={`badge ${
            entry.file_type === "json"
              ? "bg-blue-500/20 text-blue-300"
              : "bg-emerald-500/20 text-emerald-300"
          }`}
        >
          {entry.file_type}
        </span>
      </td>
      <td className="px-3 py-2 align-top mono text-xs break-all">
        {entry.build_version || "—"}
      </td>
      <td className="px-3 py-2 align-top text-xs text-[var(--color-text-muted)]">
        {formatTime(entry.uploaded_at)}
      </td>
      <td className="px-3 py-2 align-top text-xs text-[var(--color-text-muted)] mono break-all">
        {appName}
      </td>
    </tr>
  );
}

/** A flattened entry paired with its parent group — used for paginated rows. */
export interface FlatEntry {
  entry: ManifestTitleEntry;
  group: ManifestTitleGroup;
}

/**
 * The manifest table — takes a flat list of {entry, group} pairs (already
 * paginated by the caller). Renders one row per entry, with click-to-select.
 */
export function GameList({
  entries,
  onSelect,
  selected,
}: {
  entries: FlatEntry[];
  onSelect: (entry: ManifestTitleEntry, group: ManifestTitleGroup) => void;
  selected: { appName: string; effectiveId: string } | null;
}) {
  if (entries.length === 0) {
    return (
      <div className="card text-center py-8 text-[var(--color-text-muted)]">
        No manifests match your search.
      </div>
    );
  }
  return (
    <div className="card overflow-x-auto !p-0">
      <table className="w-full min-w-[640px] text-left">
        <thead className="bg-[var(--color-base-3)] text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
          <tr>
            <th className="px-3 py-2 font-semibold">Build ID</th>
            <th className="px-3 py-2 font-semibold">Type</th>
            <th className="px-3 py-2 font-semibold">Build Version</th>
            <th className="px-3 py-2 font-semibold">Uploaded</th>
            <th className="px-3 py-2 font-semibold">App Name</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(({ entry, group }) => (
            <EntryRow
              key={`${group.app_name}-${entry.effective_id}`}
              entry={entry}
              appName={group.app_name}
              onSelect={(e) => onSelect(e, group)}
              selected={
                selected?.appName === group.app_name &&
                selected?.effectiveId === entry.effective_id
              }
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}
