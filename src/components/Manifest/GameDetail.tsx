import { buildDownloadUrl, buildInfoUrl } from "~/api/manifest";
import { useInfo } from "~/hooks/useManifests";
import type { ManifestTitleEntry, ManifestTitleGroup } from "~/types/manifest";
import { findRelated } from "~/types/manifest";
import { DownloadButton } from "./DownloadButton";
import { ErrorBlock, LoadingFallback } from "~/components/Loading";
import { JsonViewer } from "~/components/JsonViewer";
import { formatBytes, formatDateTime } from "~/utils/format";

const LINK_SVG = (
  <svg viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3 opacity-60">
    <path d="M6.354 5.5H4a3 3 0 000 6h3a3 3 0 002.83-4H9.83A2 2 0 017 10H4a2 2 0 110-4h1.354zm4.292 0H12a3 3 0 010 6H9a3 3 0 01-2.83-4h.84A2 2 0 009 10h3a2 2 0 100-4h-1.354zM5.5 7.5h5v1h-5z" />
  </svg>
);

const DL_SVG = (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
    <path d="M8 2v8m0 0l-3-3m3 3l3-3M2 12v1.5a.5.5 0 00.5.5h11a.5.5 0 00.5-.5V12" />
  </svg>
);

function truncate(id: string, len = 36): string {
  return id.length > len ? id.slice(0, len) + "\u2026" : id;
}

/**
 * Detail body — fetches /info for the selected entry and renders the metadata
 * grouped into sections: Build Info, Hashes & Storage, Custom Fields.
 * Also shows a "Related manifests" section with two-tier counterpart links.
 *
 * This component renders only the *body* of the slide-over panel — the header
 * (with the close button) is provided by the SlideOver wrapper. The download
 * button is also placed at the top of the body for prominence.
 */
export function GameDetail({
  group,
  entry,
  onViewEntry,
}: {
  group: ManifestTitleGroup;
  entry: ManifestTitleEntry;
  onViewEntry?: (entry: ManifestTitleEntry, group: ManifestTitleGroup) => void;
}) {
  const { data, isLoading, error } = useInfo(group.app_name, entry.effective_id);
  const { tier1, tier2 } = findRelated(entry, group);
  const hasRelated = tier1.length > 0 || tier2.length > 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Top: title + info link + download */}
      <div>
        <div className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
          {group.display_name || group.app_name}
        </div>
        <h3 className="mt-0.5 text-base font-semibold mono break-all">
          {entry.effective_id}
        </h3>
        <div className="mt-2">
          <DownloadButton
            appName={group.app_name}
            effectiveId={entry.effective_id}
            fileName={data?.original_filename}
          />
        </div>
        <div className="mt-2 text-xs text-[var(--color-text-muted)] mono">
          <a
            href={buildInfoUrl(group.app_name, entry.effective_id)}
            target="_blank"
            rel="noreferrer noopener"
            className="text-[var(--color-accent-blue)] hover:underline"
            title={buildInfoUrl(group.app_name, entry.effective_id)}
          >
            ↗ raw /info endpoint
          </a>
        </div>
      </div>

      {isLoading && <LoadingFallback label="Fetching metadata\u2026" />}
      {error && <ErrorBlock message={(error as Error).message} />}

      {data && (
        <>
          <Section title="Build info">
            <Detail label="app_name" value={data.app_name} mono />
            <Detail label="app_id" value={String(data.app_id)} mono />
            <Detail
              label="file_type"
              value={data.file_type}
              badge={{ tone: data.file_type === "json" ? "blue" : "green" }}
            />
            <Detail label="build_version" value={data.build_version || "\u2014"} mono />
            <Detail
              label="app_version_string"
              value={data.app_version_string ?? "\u2014"}
            />
            <Detail
              label="data_version"
              value={String(data.data_version)}
              mono
            />
            <Detail
              label="feature_level"
              value={String(data.feature_level)}
              mono
            />
            <Detail label="file_size" value={formatBytes(data.file_size)} />
            <Detail
              label="uploaded_at"
              value={formatDateTime(data.uploaded_at)}
            />
            <Detail
              label="original_filename"
              value={data.original_filename || "\u2014"}
              mono
            />
          </Section>

          <Section title="Hashes & storage">
            <Detail label="sha256" value={data.sha256} mono />
            <Detail
              label="header_sha_hash"
              value={data.header_sha_hash || "\u2014"}
              mono
            />
            <Detail label="storage_path" value={data.storage_path} mono />
          </Section>

          {data.custom_fields &&
            Object.keys(data.custom_fields).length > 0 && (
              <Section title="Custom fields">
                <JsonViewer data={data.custom_fields} defaultExpandedDepth={2} />
              </Section>
            )}
        </>
      )}

      {/* Related manifests — two-tier */}
      {hasRelated ? (
        <Section title={
          <span className="flex items-center gap-1.5">
            {LINK_SVG} Related manifests ({tier1.length + tier2.length})
          </span>
        }>
          <div className="col-span-2 flex flex-col gap-2">
            {/* Tier 1: exact version match */}
            {tier1.map((c) => (
              <RelatedItem
                key={c.effective_id}
                entry={c}
                groupName={group.app_name}
                isExact
                onView={onViewEntry}
              />
            ))}
            {/* Tier 2: other versions */}
            {tier2.length > 0 && tier1.length > 0 && (
              <div className="py-1 text-[10px] uppercase tracking-wide text-[var(--color-text-muted)]">
                Other versions
              </div>
            )}
            {tier2.map((c) => (
              <RelatedItem
                key={c.effective_id}
                entry={c}
                groupName={group.app_name}
                isExact={false}
                onView={onViewEntry}
              />
            ))}
          </div>
        </Section>
      ) : (
        <Section title="Related manifests">
          <div className="col-span-2 text-sm text-[var(--color-text-muted)]">
            No {entry.file_type === "json" ? "binary" : "json"} manifests found for this app.
          </div>
        </Section>
      )}
    </div>
  );
}

/** A single related manifest row in the detail panel. */
function RelatedItem({
  entry: c,
  groupName,
  isExact,
  onView,
}: {
  entry: ManifestTitleEntry;
  groupName: string;
  isExact: boolean;
  onView?: (entry: ManifestTitleEntry, group: ManifestTitleGroup) => void;
}) {
  const dlHref = buildDownloadUrl(groupName, c.effective_id);
  const dlFileName = `${c.effective_id}.${c.file_type === "binary" ? "manifest" : "item"}`;
  const badgeClass = c.file_type === "json"
    ? "bg-[var(--color-accent-blue)]/15 text-[var(--color-accent-blue)]"
    : "bg-[var(--color-accent)]/15 text-[var(--color-accent)]";
  const dlBtnClass = c.file_type === "binary"
    ? "bg-[var(--color-accent)] text-black hover:bg-[var(--color-accent-hover)]"
    : "bg-[var(--color-accent-blue)] text-black";

  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-white/10 bg-[var(--color-bg-3)] px-3 py-2.5 transition-colors hover:border-white/20">
      <div className="min-w-0 flex-1">
        <span className={`badge ${badgeClass} mb-1`}>{c.file_type}</span>
        {isExact && (
          <span className="ml-1.5 rounded bg-[var(--color-accent)]/10 px-1.5 py-0.5 text-[9px] font-medium text-[var(--color-accent)]">
            same version
          </span>
        )}
        <div className="mono text-xs break-all" title={c.effective_id}>
          {truncate(c.effective_id)}
        </div>
        <div className="mt-0.5 text-[11px] text-[var(--color-text-muted)]">
          v{c.build_version || "?"}
          {" \u00B7 "}
          {c.uploaded_at ? new Date(c.uploaded_at).toLocaleDateString() : ""}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <a
          href={dlHref}
          download={dlFileName}
          title={`Download ${c.file_type}`}
          className={`inline-flex items-center justify-center rounded-md p-1.5 transition-colors ${dlBtnClass}`}
        >
          {DL_SVG}
        </a>
        {onView && (
          <button
            type="button"
            onClick={() =>
              onView(c, {
                app_name: groupName,
                display_name: "",
                build_versions: [],
                entries: [c],
                entry_count: 1,
              })
            }
            className="btn-outline !px-2.5 !py-1.5 !text-xs"
          >
            View
          </button>
        )}
      </div>
    </div>
  );
}

/** A titled block of metadata rows. */
function Section({
  title,
  children,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-white/10 pt-3">
      <h4 className="mb-2 text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
        {title}
      </h4>
      <div className="grid grid-cols-1 gap-y-2 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function Detail({
  label,
  value,
  mono,
  badge,
}: {
  label: string;
  value: string;
  mono?: boolean;
  badge?: { tone: "blue" | "green" };
}) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] uppercase tracking-wide text-[var(--color-text-muted)]">
        {label}
      </div>
      {badge ? (
        <div className="mt-0.5">
          <span
            className={`badge ${
              badge.tone === "blue"
                ? "bg-[var(--color-accent-blue)]/15 text-[var(--color-accent-blue)]"
                : "bg-[var(--color-accent)]/15 text-[var(--color-accent)]"
            }`}
          >
            {value}
          </span>
        </div>
      ) : (
        <div
          className={`mt-0.5 text-sm break-words ${mono ? "mono text-xs" : ""}`}
        >
          {value}
        </div>
      )}
    </div>
  );
}
