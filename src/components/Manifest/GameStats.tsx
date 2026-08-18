import { useStats } from "~/hooks/useManifests";
import { ErrorBlock, LoadingFallback } from "~/components/Loading";

/** Top-of-page stats banner — total manifests, total apps, last update. */
export function GameStats() {
  const { data, isLoading, error } = useStats();
  if (isLoading) return <LoadingFallback label="Loading stats…" />;
  if (error) return <ErrorBlock message={(error as Error).message} />;
  if (!data) return null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard label="Total manifests" value={data.total_manifests.toLocaleString()} />
      <StatCard label="Total apps" value={data.total_apps.toLocaleString()} />
      <StatCard label="Last update" value={formatTime(data.last_updated)} />
      <StatCard label="Storage" value={data.storage_path} mono />
    </div>
  );
}

function StatCard({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="card">
      <div className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
        {label}
      </div>
      <div className={`mt-1 text-lg font-semibold ${mono ? "mono text-sm break-all" : ""}`}>
        {value}
      </div>
    </div>
  );
}

function formatTime(iso: string | null): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso;
  }
}
