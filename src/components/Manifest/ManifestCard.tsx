import { useState } from "react";
import type { ManifestTitleEntry, ManifestTitleGroup } from "~/types/manifest";
import { isSha1Fallback, findRelated } from "~/types/manifest";
import { buildDownloadUrl } from "~/api/manifest";
import { DownloadButton } from "./DownloadButton";
import { formatRelativeTime } from "~/utils/format";

/**
 * Colors used for the file-type visual grouping. Binary = green, JSON = light
 * blue. Each card has a thick left border in its type color plus a matching
 * badge, so binary and JSON entries are visually clustered at a glance.
 */
const TYPE_STYLES: Record<
  ManifestTitleEntry["file_type"],
  { border: string; badge: string; label: string; pillBg: string; pillBorder: string; pillText: string }
> = {
  binary: {
    border: "border-l-[var(--color-accent)]",
    badge: "bg-[var(--color-accent)]/15 text-[var(--color-accent)]",
    label: "binary",
    pillBg: "bg-[var(--color-accent)]/10",
    pillBorder: "border-[var(--color-accent)]/25",
    pillText: "text-[var(--color-accent)]",
  },
  json: {
    border: "border-l-[var(--color-accent-blue)]",
    badge: "bg-[var(--color-accent-blue)]/15 text-[var(--color-accent-blue)]",
    label: "json",
    pillBg: "bg-[var(--color-accent-blue)]/10",
    pillBorder: "border-[var(--color-accent-blue)]/25",
    pillText: "text-[var(--color-accent-blue)]",
  },
};

const DL_SVG = (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 shrink-0 opacity-80">
    <path d="M8 2v8m0 0l-3-3m3 3l3-3M2 12v1.5a.5.5 0 00.5.5h11a.5.5 0 00.5-.5V12" />
  </svg>
);

const LINK_SVG = (
  <svg viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3 opacity-60">
    <path d="M6.354 5.5H4a3 3 0 000 6h3a3 3 0 002.83-4H9.83A2 2 0 017 10H4a2 2 0 110-4h1.354zm4.292 0H12a3 3 0 010 6H9a3 3 0 01-2.83-4h.84A2 2 0 009 10h3a2 2 0 100-4h-1.354zM5.5 7.5h5v1h-5z" />
  </svg>
);

function truncate(id: string, len = 16): string {
  return id.length > len ? id.slice(0, len) + "\u2026" : id;
}

/**
 * A single manifest entry rendered as a card. The game's display_name is the
 * prominent title; app_name shows below as a smaller mono caption. The
 * file-type color is on the left border + the type badge for visual grouping.
 * Each card has its own Download button (no need to open the detail panel
 * just to grab the file) plus a "Details" button to open the slide-over.
 *
 * Now includes a two-tier counterpart section:
 *   Tier 1 — exact build_version match (prominent download pills)
 *   Tier 2 — same app, different version (collapsible, click row = navigate, click dl icon = download)
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
  const title = group.display_name || group.app_name;
  const [tier2Open, setTier2Open] = useState(false);

  const { tier1, tier2 } = findRelated(entry, group);
  const hasRelated = tier1.length > 0 || tier2.length > 0;

  // Opposite type label for Tier 2 heading
  const oppType = entry.file_type === "json" ? "binary" : "json";

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
      <dl className="mb-1 grid grid-cols-1 gap-y-2 text-sm">
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
            {entry.build_version || "\u2014"}
          </dd>
        </div>
      </dl>

      {/* Two-tier counterpart section */}
      {hasRelated && (
        <div className="mt-3 border-t border-dashed border-white/10 pt-3">
          {/* Tier 1: exact build_version match — download pills */}
          {tier1.length > 0 && (
            <>
              <div className="mb-2 flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-[var(--color-text-muted)]">
                {LINK_SVG}
                Counterpart
                <span className="font-semibold text-[var(--color-text)]">{tier1.length}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {tier1.map((c) => {
                  const cStyle = TYPE_STYLES[c.file_type];
                  return (
                    <a
                      key={c.effective_id}
                      href={buildDownloadUrl(group.app_name, c.effective_id)}
                      download={`${c.effective_id}.${c.file_type === "binary" ? "manifest" : "item"}`}
                      onClick={(e) => e.stopPropagation()}
                      title={`Download ${c.file_type}: ${c.effective_id}`}
                      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-mono transition-colors ${cStyle.pillBg} ${cStyle.pillBorder} border`}
                    >
                      <span className={`font-sans text-[10px] font-semibold uppercase ${cStyle.pillText}`}>
                        {c.file_type}
                      </span>
                      <span className="text-[var(--color-text-muted)] max-w-[120px] truncate">
                        {truncate(c.effective_id)}
                      </span>
                      <span className={cStyle.pillText}>{DL_SVG}</span>
                    </a>
                  );
                })}
              </div>
            </>
          )}

          {/* Tier 2: other versions — collapsible */}
          {tier2.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => setTier2Open((v) => !v)}
                className="mt-2 flex items-center gap-1.5 text-[11px] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
              >
                <span className={`inline-block text-[9px] transition-transform ${tier2Open ? "rotate-90" : ""}`}>
                  ▶
                </span>
                Other {oppType} versions ({tier2.length})
              </button>
              {tier2Open && (
                <div className="mt-1.5 flex flex-col gap-1">
                  {tier2.map((c) => {
                    const cStyle = TYPE_STYLES[c.file_type];
                    return (
                      <div
                        key={c.effective_id}
                        onClick={() => onSelect(c, group)}
                        className="flex cursor-pointer items-center gap-2 rounded-md border border-white/10 bg-[var(--color-bg-3)] px-2.5 py-1.5 text-[11px] transition-colors hover:bg-white/5"
                      >
                        <span className={`font-sans text-[9px] font-semibold uppercase ${cStyle.pillText}`}>
                          {c.file_type}
                        </span>
                        <span className="text-[var(--color-text-muted)]">
                          v{c.build_version || "?"}
                          {" \u00B7 "}
                          {formatRelativeTime(c.uploaded_at)}
                        </span>
                        {/* Download icon — stopPropagation so clicking it doesn't navigate */}
                        <a
                          href={buildDownloadUrl(group.app_name, c.effective_id)}
                          download={`${c.effective_id}.${c.file_type === "binary" ? "manifest" : "item"}`}
                          onClick={(e) => e.stopPropagation()}
                          title={`Download ${c.file_type}: ${c.effective_id}`}
                          className={`ml-auto shrink-0 ${cStyle.pillText}`}
                        >
                          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                            <path d="M8 2v8m0 0l-3-3m3 3l3-3M2 12v2h12v-2" />
                          </svg>
                        </a>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="mt-3 flex items-center gap-2">
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
