import { useState, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router";
import { useInfo, useTitles } from "~/hooks/useManifests";
import { buildDownloadUrl, buildInfoUrl } from "~/api/manifest";
import { findRelated } from "~/types/manifest";
import type { ManifestTitleEntry } from "~/types/manifest";
import { ErrorBlock, LoadingFallback } from "~/components/Loading";
import { formatBytes, formatDateTime } from "~/utils/format";

const DL_SVG = (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
    <path d="M8 2v8m0 0l-3-3m3 3l3-3M2 12v1.5a.5.5 0 00.5.5h11a.5.5 0 00.5-.5V12" />
  </svg>
);

const LINK_SVG = (
  <svg viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3 opacity-60">
    <path d="M6.354 5.5H4a3 3 0 000 6h3a3 3 0 002.83-4H9.83A2 2 0 017 10H4a2 2 0 110-4h1.354zm4.292 0H12a3 3 0 010 6H9a3 3 0 01-2.83-4h.84A2 2 0 009 10h3a2 2 0 100-4h-1.354zM5.5 7.5h5v1h-5z" />
  </svg>
);

/**
 * Dedicated manifest detail page — replaces the old SlideOver.
 * Route: /manifests/:appName/:effectiveId
 *
 * Layout: breadcrumb → header row → 3 boxes (Build Info, Custom Fields, Hashes & Storage) → Related manifests.
 */
export function ManifestDetailPage() {
  const { appName, effectiveId } = useParams<{ appName: string; effectiveId: string }>();
  const navigate = useNavigate();

  const { data: titles, isLoading: titlesLoading } = useTitles();
  const { data: info, isLoading: infoLoading, error: infoError } = useInfo(appName ?? null, effectiveId ?? null);

  // Find the group and entry from titles data for related manifests
  const group = titles?.games.find((g) => g.app_name === appName);
  const entry = group?.entries.find((e) => e.effective_id === effectiveId);
  const displayName = group?.display_name || appName || "";

  const { tier1, tier2 } = entry && group ? findRelated(entry, group) : { tier1: [], tier2: [] };
  const hasRelated = tier1.length > 0 || tier2.length > 0;

  if (titlesLoading || infoLoading) {
    return <LoadingFallback label="Loading manifest details…" />;
  }

  if (infoError || !info) {
    return <ErrorBlock message={(infoError as Error)?.message || "Manifest not found"} />;
  }

  const eid = effectiveId ?? "";
  const dlHref = buildDownloadUrl(info.app_name, eid);
  const dlFileName = info.original_filename || `${eid}.${info.file_type === "binary" ? "manifest" : "item"}`;
  const badgeClass = info.file_type === "json"
    ? "bg-[var(--color-accent-blue)]/15 text-[var(--color-accent-blue)]"
    : "bg-[var(--color-accent)]/15 text-[var(--color-accent)]";

  return (
    <div className="mx-auto max-w-7xl px-6 pb-12">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 py-3 text-sm text-[var(--color-text-muted)]">
        <Link to="/manifests" className="text-[var(--color-accent-blue)] hover:underline">Manifests</Link>
        <span className="opacity-40">/</span>
        {displayName && (
          <>
            <Link to="/manifests" className="text-[var(--color-accent-blue)] hover:underline">{displayName}</Link>
            <span className="opacity-40">/</span>
          </>
        )}
        <span className="mono text-[var(--color-text)]">{effectiveId ? (effectiveId.length > 16 ? effectiveId.slice(0, 16) + "\u2026" : effectiveId) : ""}</span>
      </nav>

      {/* Header row */}
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-semibold">{displayName}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[var(--color-text-muted)]">
            <span className={`badge ${badgeClass}`}>{info.file_type}</span>
            <span className="mono break-all text-xs">{eid}</span>
          </div>
          <div className="mt-0.5 text-sm text-[var(--color-text-muted)]">
            v{info.build_version || "?"} · {formatBytes(info.file_size)} · {formatDateTime(info.uploaded_at)}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <a href={dlHref} download={dlFileName} className="btn-primary flex items-center gap-1.5">
            {DL_SVG} Download
          </a>
          <a href={buildInfoUrl(info.app_name, eid)} target="_blank" rel="noreferrer noopener" className="btn-outline">
            ↗ Raw /info
          </a>
        </div>
      </div>

      {/* 3 Boxes */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 items-start">
        {/* Build Info */}
        <div className="card">
          <h3 className="mb-2.5 text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Build Info</h3>
          <KvRow label="app_name" value={info.app_name} mono />
          <KvRow label="app_id" value={String(info.app_id)} mono />
          <KvRow label="file_type" value={info.file_type} badge={info.file_type === "json" ? "blue" : "green"} />
          <KvRow label="build_version" value={info.build_version || "\u2014"} mono />
          <KvRow label="app_version" value={info.app_version_string ?? "\u2014"} />
          <KvRow label="data_version" value={String(info.data_version)} mono />
          <KvRow label="feature_level" value={String(info.feature_level)} mono />
          <KvRow label="file_size" value={formatBytes(info.file_size)} />
          <KvRow label="uploaded_at" value={formatDateTime(info.uploaded_at)} />
          <KvRow label="filename" value={info.original_filename || "\u2014"} mono />
        </div>

        {/* Custom Fields */}
        <div className="card flex max-h-[520px] min-h-0 flex-col overflow-hidden">
          <h3 className="mb-2.5 shrink-0 text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Custom Fields</h3>
          {info.custom_fields && Object.keys(info.custom_fields).length > 0 ? (
            <div className="min-h-0 flex-1 overflow-y-auto">
              <CustomFieldsAccordion fields={info.custom_fields} />
            </div>
          ) : (
            <p className="text-sm text-[var(--color-text-muted)]">No custom fields.</p>
          )}
        </div>

        {/* Hashes & Storage */}
        <div className="card">
          <h3 className="mb-2.5 text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Hashes & Storage</h3>
          <KvRow label="sha256" value={info.sha256} mono small />
          <KvRow label="header_sha" value={info.header_sha_hash || "\u2014"} mono small />
          <KvRow label="storage_path" value={info.storage_path} mono small />
        </div>
      </div>

      {/* Related manifests */}
      <div className="border-t border-white/10 pt-4">
        <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
          {LINK_SVG}
          Related Manifests ({tier1.length + tier2.length})
        </h3>
        {!hasRelated ? (
          <p className="text-sm text-[var(--color-text-muted)]">
            No {info.file_type === "json" ? "binary" : "json"} manifests found for this app.
          </p>
        ) : (
          <>
            {/* Tier 1 */}
            {tier1.length > 0 && (
              <>
                <div className="py-1.5 text-[13px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Exact version match</div>
                <div className="mb-3 flex flex-col gap-2">
                  {tier1.map((c) => (
                    <RelatedItem
                      key={c.effective_id}
                      entry={c}
                      groupName={info.app_name}
                      isExact
                      onNavigate={() => navigate(`/manifests/${encodeURIComponent(info.app_name)}/${encodeURIComponent(c.effective_id)}`)}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Tier 2 */}
            {tier2.length > 0 && (
              <>
                {tier1.length > 0 && <div className="py-1.5 text-[13px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Other versions</div>}
                <div className="flex flex-col gap-2">
                  {tier2.map((c) => (
                    <RelatedItem
                      key={c.effective_id}
                      entry={c}
                      groupName={info.app_name}
                      isExact={false}
                      onNavigate={() => navigate(`/manifests/${encodeURIComponent(info.app_name)}/${encodeURIComponent(c.effective_id)}`)}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ── Sub-components ── */

/** Accordion for custom fields — each key is a collapsible row. */
function CustomFieldsAccordion({ fields }: { fields: Record<string, unknown> }) {
  const entries = Object.entries(fields);
  const [openSet, setOpenSet] = useState<Set<string>>(new Set());

  const toggle = useCallback((key: string) => {
    setOpenSet((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  return (
    <div className="flex flex-col">
      {entries.map(([key, value]) => {
        const isOpen = openSet.has(key);
        const isComplex = value !== null && typeof value === "object";
        const preview = isComplex
          ? `${Array.isArray(value) ? "Array" : "Object"}(${Object.keys(value as object).length})`
          : String(value);
        const displayValue = isComplex
          ? JSON.stringify(value, null, 2)
          : String(value);

        return (
          <div key={key} className="border-b border-white/5 last:border-b-0">
            <button
              type="button"
              onClick={() => toggle(key)}
              className="flex w-full items-center gap-2 py-1.5 text-left transition-colors hover:bg-white/5"
            >
              <span className="w-3.5 shrink-0 text-[11px] text-[var(--color-text-muted)]">
                {isOpen ? "▼" : "▶"}
              </span>
              <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-[var(--color-accent)]">{key}</span>
              <span className={`shrink-0 truncate ${isComplex ? "text-[11px] text-[var(--color-text-muted)]" : "font-mono text-[13px] text-[var(--color-text)]"}`}>
                {isComplex ? preview : (preview.length > 32 ? preview.slice(0, 32) + "…" : preview)}
              </span>
            </button>
            {isOpen && (
              <pre className="ml-5.5 mb-1.5 overflow-x-auto whitespace-pre-wrap break-all font-mono text-[13px] leading-relaxed text-[var(--color-text-muted)]">
                {displayValue}
              </pre>
            )}
          </div>
        );
      })}
    </div>
  );
}

function KvRow({ label, value, mono, badge, small }: {
  label: string;
  value: string;
  mono?: boolean;
  badge?: "blue" | "green";
  small?: boolean;
}) {
  return (
    <div className="grid grid-cols-[110px_1fr] items-baseline gap-4 border-b border-white/5 py-1.5 text-sm last:border-b-0">
      <span className="truncate text-[13px] uppercase tracking-wide text-[var(--color-text-muted)]">{label}</span>
      {badge ? (
        <span className={`badge ${badge === "blue" ? "bg-[var(--color-accent-blue)]/15 text-[var(--color-accent-blue)]" : "bg-[var(--color-accent)]/15 text-[var(--color-accent)]"}`}>
          {value}
        </span>
      ) : (
        <span className={`break-all ${mono ? "font-mono text-sm" : ""} ${small ? "!text-[13px]" : ""}`}>{value}</span>
      )}
    </div>
  );
}

function RelatedItem({ entry: c, groupName, isExact, onNavigate }: {
  entry: ManifestTitleEntry;
  groupName: string;
  isExact: boolean;
  onNavigate: () => void;
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
    <div
      className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/10 bg-[var(--color-bg-3)] px-4 py-3 transition-colors hover:border-white/20"
      onClick={onNavigate}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter") onNavigate(); }}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className={`badge ${badgeClass}`}>{c.file_type}</span>
          {isExact && (
            <span className="rounded bg-[var(--color-accent)]/10 px-1.5 py-0.5 text-[11px] font-medium text-[var(--color-accent)]">
              same version
            </span>
          )}
        </div>
        <div className="mono break-all text-sm" title={c.effective_id}>
          {c.effective_id.length > 40 ? c.effective_id.slice(0, 40) + "\u2026" : c.effective_id}
        </div>
        <div className="mt-0.5 text-[13px] text-[var(--color-text-muted)]">
          v{c.build_version || "?"}{" \u00B7 "}
          {c.uploaded_at ? new Date(c.uploaded_at).toLocaleDateString() : ""}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          className="btn-outline !px-2.5 !py-1.5 !text-xs"
          onClick={(e) => { e.stopPropagation(); onNavigate(); }}
        >
          View
        </button>
        <a
          href={dlHref}
          download={dlFileName}
          title={`Download ${c.file_type}`}
          className={`inline-flex items-center justify-center rounded-md p-1.5 transition-colors ${dlBtnClass}`}
          onClick={(e) => e.stopPropagation()}
        >
          {DL_SVG}
        </a>
      </div>
    </div>
  );
}