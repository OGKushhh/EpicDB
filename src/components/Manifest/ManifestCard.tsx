import type { ManifestTitleEntry, ManifestTitleGroup } from "~/types/manifest";
import { isSha1Fallback } from "~/types/manifest";
import { DownloadButton } from "./DownloadButton";
import { formatRelativeTime } from "~/utils/format";

/**
 * Colors used for the file-type visual grouping. Binary = green, JSON = light
 * blue. Each card has a thick left border in its type color plus a matching
 * badge, so binary and JSON entries are visually clustered at a glance.
 */
const TYPE_STYLES: Record<
  ManifestTitleEntry["file_type"],
  { border: string; badge: string; label: string }
> = {
  binary: {
    border: "border-l-[var(--color-accent)]",
    badge: "bg-[var(--color-accent)]/15 text-[var(--color-accent)]",
    label: "binary",
  },
  json: {
    border: "border-l-[var(--color-accent-blue)]",
    badge: "bg-[var(--color-accent-blue)]/15 text-[var(--color-accent-blue)]",
    label: "json",
  },
};

/**
 * A single manifest entry rendered as a card. The game's display_name is the
 * prominent title; app_name shows below as a smaller mono caption. The
 * file-type color is on the left border + the type badge for visual grouping.
 * Each card has its own Download button (no need to open the detail panel
 * just to grab the file) plus a "Details" button to open the slide-over.
 */
export function ManifestCard({
  entry,
  group,
  selected,
  onSelect,
}: {
  entry: ManifestTitleEntry;
  group: ManifestTitleGroup;
  selected: boolean;
  onSelect: (entry: ManifestTitleEntry, group: ManifestTitleGroup) => void;
}) {
  const type = TYPE_STYLES[entry.file_type];
  const fallback = isSha1Fallback(entry);
  // Prefer the group's display_name; fall back to app_name if blank.
  const title = group.display_name || group.app_name;

  return (
    <div
      className={`card ${type.border} border-l-4 transition-colors ${
        selected
          ? "ring-1 ring-[var(--color-accent-blue)]/50"
          : "hover:border-white/25"
      }`}
    >
      {/* Title + app_name caption */}
      <div className="mb-3">
        <h3 className="text-[22px] font-bold leading-tight break-words text-white">
          {title}
        </h3>
        <div className="mt-0.5 mono text-xs text-[var(--color-text-muted)] break-all">
          {group.app_name}
        </div>
      </div>

      {/* Type badge + uploaded relative time */}
      <div className="mb-3 flex items-center gap-2 text-xs">
        <span className={`badge ${type.badge}`}>{type.label}</span>
        {fallback && (
          <span
            className="badge bg-amber-500/20 text-amber-300"
            title='SHA1 fallback — old binary manifest (DataVersion 0). Original build_id was empty or "unknown".'
          >
            fallback
          </span>
        )}
        <span className="ml-auto text-[var(--color-text-muted)]">
          {formatRelativeTime(entry.uploaded_at)}
        </span>
      </div>

      {/* Detail grid: Build ID + Build version */}
      <dl className="mb-4 grid grid-cols-1 gap-y-2 text-sm">
        <div className="flex flex-col">
          <dt className="text-[10px] uppercase tracking-wide text-[var(--color-text-muted)]">
            Build ID
          </dt>
          <dd className="mono text-xs break-all">{entry.effective_id}</dd>
        </div>
        <div className="flex flex-col">
          <dt className="text-[10px] uppercase tracking-wide text-[var(--color-text-muted)]">
            Build version
          </dt>
          <dd className="mono text-xs break-all">
            {entry.build_version || "—"}
          </dd>
        </div>
      </dl>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <DownloadButton
          appName={group.app_name}
          effectiveId={entry.effective_id}
          fileName={`${entry.effective_id}.${entry.file_type === "binary" ? "manifest" : "item"}`}
        />
        <button
          onClick={() => onSelect(entry, group)}
          className="btn-outline !px-3 !py-2 !text-sm"
          title="View full metadata"
        >
          Details ▶
        </button>
      </div>
    </div>
  );
}
