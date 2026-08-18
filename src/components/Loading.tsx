import { type ReactNode } from "react";

/** Spinner — small SVG spinner, no external deps. */
export function Spinner({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`inline-block animate-spin ${className}`}
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="3"
      />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Full-card loading state. */
export function LoadingFallback({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex h-32 items-center justify-center gap-3 text-[var(--color-text-muted)]">
      <Spinner className="text-base" />
      <span>{label}</span>
    </div>
  );
}

/** Skeleton grid for games list. */
export function GameGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="card animate-pulse !p-3"
          style={{ minHeight: 96 }}
        >
          <div className="mb-2 h-4 w-3/4 rounded bg-white/10" />
          <div className="mb-1 h-3 w-1/2 rounded bg-white/5" />
          <div className="h-3 w-2/3 rounded bg-white/5" />
        </div>
      ))}
    </div>
  );
}

/** Generic empty state. */
export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center justify-center gap-2 py-10 text-center">
      <div className="text-lg font-medium">{title}</div>
      {hint && <div className="text-sm text-[var(--color-text-muted)]">{hint}</div>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/** Error display block. */
export function ErrorBlock({ message }: { message: string }) {
  return (
    <div className="card border-red-500/40 bg-red-500/10 text-red-200">
      <div className="mb-1 flex items-center gap-2 font-semibold">
        <span aria-hidden>⚠</span> Error
      </div>
      <div className="mono text-xs whitespace-pre-wrap">{message}</div>
    </div>
  );
}
