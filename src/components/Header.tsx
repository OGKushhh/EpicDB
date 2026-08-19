import { Link, useLocation } from "react-router";

/** Routes (kept here so both header and routing logic share one source of truth). */
export const routes = {
  home: "/",
  manifests: "/manifests",
  browse: "/browse",
  game: "/browse/:namespace",
} as const;

const TABS: Array<{ to: string; label: string; pattern: string }> = [
  { to: routes.home, label: "Home", pattern: routes.home },
  { to: routes.manifests, label: "Manifest", pattern: routes.manifests },
  { to: routes.browse, label: "Browse", pattern: routes.browse },
];

export function Header() {
  const location = useLocation();
  return (
    <header className="sticky top-0 z-20 border-b border-black/15 bg-[var(--color-header-bg)]">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-8 px-6">
        {/* Merged logo: single box showing "EpicDB" with light-blue bg + white text. */}
        <Link
          to={routes.home}
          className="inline-flex items-center justify-center rounded-md bg-[var(--color-logo-bg)] px-4 py-2 text-xl font-bold tracking-tight text-white shadow-md transition-transform hover:scale-[1.02]"
        >
          EpicDB
        </Link>

        <nav className="flex items-center gap-2">
          {TABS.map((tab) => {
            const active =
              tab.pattern === routes.home
                ? location.pathname === routes.home
                : location.pathname.startsWith(tab.pattern);
            return (
              <Link
                key={tab.to}
                to={tab.to}
                className={`rounded-md px-5 py-2.5 text-base font-medium transition-colors ${
                  active
                    ? "bg-black/10 text-[var(--color-header-fg)]"
                    : "text-[var(--color-header-fg-muted)] hover:bg-black/5 hover:text-[var(--color-header-fg)]"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-4 text-base text-[var(--color-header-fg-muted)]">
          <a
            href="https://github.com/acidicoala/EpicDB#readme"
            target="_blank"
            rel="noreferrer noopener"
            className="hover:text-[var(--color-header-fg)]"
          >
            GitHub
          </a>
        </div>
      </div>
    </header>
  );
}
