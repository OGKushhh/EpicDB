import { buildInfoUrl } from "~/api/manifest";
import { useInfo } from "~/hooks/useManifests";
import type { ManifestTitleEntry, ManifestTitleGroup } from "~/types/manifest";
import { DownloadButton } from "./DownloadButton";
import { ErrorBlock, LoadingFallback } from "~/components/Loading";
import { JsonViewer } from "~/components/JsonViewer";
import { formatBytes, formatDateTime } from "~/utils/format";

/**
 * Detail body — fetches /info for the selected entry and renders the metadata
 * grouped into sections: Build Info, Hashes & Storage, Custom Fields.
 *
 * This component renders only the *body* of the slide-over panel — the header
 * (with the close button) is provided by the SlideOver wrapper. The download
 * button is also placed at the top of the body for prominence.
 */
export function GameDetail({
  group,
  entry,
}: {
  group: ManifestTitleGroup;
  entry: ManifestTitleEntry;
}) {
  const { data, isLoading, error } = useInfo(group.app_name, entry.effective_id);

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

      {isLoading && <LoadingFallback label="Fetching metadata…" />}
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
            <Detail label="build_version" value={data.build_version || "—"} mono />
            <Detail
              label="app_version_string"
              value={data.app_version_string ?? "—"}
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
              value={data.original_filename || "—"}
              mono
            />
          </Section>

          <Section title="Hashes & storage">
            <Detail label="sha256" value={data.sha256} mono />
            <Detail
              label="header_sha_hash"
              value={data.header_sha_hash || "—"}
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
    </div>
  );
}

/** A titled block of metadata rows. */
function Section({
  title,
  children,
}: {
  title: string;
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
