import { Link, useLocation } from "react-router";

/** Routes (kept here so both header and routing logic share one source of truth). */
export const routes = {
  home: "/",
  manifests: "/manifests",
  graphql: "/graphql",
} as const;

const TABS: Array<{ to: string; label: string; pattern: string }> = [
  { to: routes.manifests, label: "Manifest", pattern: routes.manifests },
  { to: routes.graphql, label: "GraphQL", pattern: routes.graphql },
];

export function Header() {
  const location = useLocation();
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[var(--color-base-2)]/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4">
        <Link to={routes.home} className="flex items-center gap-2 font-bold">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded bg-[var(--color-accent)] text-black">
            E
          </span>
          <span className="text-base tracking-tight">EpicDB</span>
        </Link>

        <nav className="flex items-center gap-1">
          {TABS.map((tab) => {
            const active = location.pathname.startsWith(tab.pattern);
            return (
              <Link
                key={tab.to}
                to={tab.to}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-white/10 text-[var(--color-text)]"
                    : "text-[var(--color-text-muted)] hover:bg-white/5 hover:text-[var(--color-text)]"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
          <a
            href="https://github.com/acidicoala/EpicDB#readme"
            target="_blank"
            rel="noreferrer noopener"
            className="hover:text-[var(--color-text)]"
          >
            GitHub
          </a>
        </div>
      </div>
    </header>
  );
}
