import type { ManifestTitleEntry, ManifestTitleGroup } from "~/types/manifest";
import { ManifestCard } from "./ManifestCard";

/**
 * A flattened entry paired with its parent group — passed in from the page so
 * the grid stays purely presentational. Same shape the old GameList used.
 */
export interface FlatEntry {
  entry: ManifestTitleEntry;
  group: ManifestTitleGroup;
}

/**
 * Responsive grid of manifest cards. 1 column on mobile, 2 on small tablets,
 * 3 on desktop. Each card shows the game title (display_name) prominently,
 * a color-coded left border + badge for binary/json visual grouping, the
 * Build ID, the build version, a relative upload time, and per-card Download +
 * Details buttons.
 */
export function ManifestCardGrid({
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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {entries.map(({ entry, group }) => (
        <ManifestCard
          key={`${group.app_name}-${entry.effective_id}`}
          entry={entry}
          group={group}
          selected={
            selected?.appName === group.app_name &&
            selected?.effectiveId === entry.effective_id
          }
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
