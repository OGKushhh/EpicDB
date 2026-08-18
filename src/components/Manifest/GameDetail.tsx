import { buildInfoUrl } from "~/api/manifest";
import { useInfo } from "~/hooks/useManifests";
import type { ManifestTitleEntry, ManifestTitleGroup } from "~/types/manifest";
import { DownloadButton } from "./DownloadButton";
import { ErrorBlock, LoadingFallback } from "~/components/Loading";
import { JsonViewer } from "~/components/JsonViewer";

/** Right-side detail panel — fetches /info for the selected entry. */
export function GameDetail({
  group,
  entry,
}: {
  group: ManifestTitleGroup;
  entry: ManifestTitleEntry;
}) {
  const { data, isLoading, error } = useInfo(group.app_name, entry.effective_id);

  return (
    <div className="card flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
            {group.display_name || group.app_name}
          </div>
          <h2 className="text-lg font-semibold mono break-all">
            {entry.effective_id}
          </h2>
          <div className="mt-1 text-xs text-[var(--color-text-muted)] mono">
            info URL: <span className="break-all">{buildInfoUrl(group.app_name, entry.effective_id)}</span>
          </div>
        </div>
        <DownloadButton
          appName={group.app_name}
          effectiveId={entry.effective_id}
          fileName={data?.original_filename}
        />
      </div>

      {isLoading && <LoadingFallback label="Fetching metadata…" />}
      {error && <ErrorBlock message={(error as Error).message} />}
      {data && (
        <div className="grid grid-cols-2 gap-2 border-t border-white/10 pt-3 text-sm sm:grid-cols-3">
          <Detail label="app_name" value={data.app_name} />
          <Detail label="app_id" value={String(data.app_id)} />
          <Detail label="file_type" value={data.file_type} />
          <Detail label="build_version" value={data.build_version} />
          <Detail label="app_version_string" value={data.app_version_string ?? "—"} />
          <Detail label="data_version" value={String(data.data_version)} />
          <Detail label="feature_level" value={String(data.feature_level)} />
          <Detail label="file_size" value={formatBytes(data.file_size)} />
          <Detail label="uploaded_at" value={formatTime(data.uploaded_at)} />
          <Detail label="sha256" value={data.sha256} mono />
          <Detail label="header_sha_hash" value={data.header_sha_hash || "—"} mono />
          <Detail label="storage_path" value={data.storage_path} mono />
        </div>
      )}

      {data?.custom_fields && Object.keys(data.custom_fields).length > 0 && (
        <div className="border-t border-white/10 pt-3">
          <div className="mb-1 text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
            custom_fields
          </div>
          <JsonViewer data={data.custom_fields} defaultExpandedDepth={2} />
        </div>
      )}
    </div>
  );
}

function Detail({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-[var(--color-text-muted)]">
        {label}
      </div>
      <div className={`text-sm break-all ${mono ? "mono" : ""}`}>{value}</div>
    </div>
  );
}

function formatBytes(n: number): string {
  if (!n) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(n) / Math.log(1024));
  return `${(n / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}
