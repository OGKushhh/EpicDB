import { Link } from "react-router";
import { routes } from "~/components/Header";

/**
 * Landing page — explains what EpicDB is, in plain language. Two cards link
 * to the main tools (Manifest Browser + Game Browser). Intro paragraph
 * describes where the data comes from and what each section does.
 */
export function HomePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight">Welcome to EpicDB</h1>
        <p className="mt-3 text-lg text-[var(--color-text)]">
          A browsable archive of Epic Games manifests and the full Epic Games Store catalog.
        </p>
      </header>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">What is this?</h2>
        <p className="text-base leading-relaxed text-[var(--color-text-muted)]">
          EpicDB is a hobby project that brings together two datasets: a community archive of
          Epic Games manifest files (uploaded to the Epic-Unlocker backend), and the live
          catalog of every game on the Epic Games Store (queried directly from Epic's GraphQL
          endpoint). It is <strong className="text-[var(--color-text)]">not affiliated with Epic Games</strong> — this is a
          fan-built tool for browsing data that's otherwise scattered or hard to access.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">What can you do here?</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Link
            to={routes.manifests}
            className="card group transition-colors hover:border-[var(--color-accent-blue)] hover:bg-[var(--color-accent-blue)]/5"
          >
            <div className="text-3xl mb-3">📦</div>
            <h3 className="text-lg font-semibold">Manifest Browser</h3>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">
              Search the uploaded manifest archive. Every entry shows its{" "}
              <code className="mono text-xs">effective_id</code>, build version, file type,
              and full metadata. You can download raw .manifest files directly.
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-base text-[var(--color-accent-blue)] group-hover:underline">
              Browse manifests →
            </span>
          </Link>

          <Link
            to={routes.browse}
            className="card group transition-colors hover:border-[var(--color-accent-blue)] hover:bg-[var(--color-accent-blue)]/5"
          >
            <div className="text-3xl mb-3">🎮</div>
            <h3 className="text-lg font-semibold">Game Browser</h3>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">
              Browse the full Epic Games Store catalog as a grid of game cards with
              thumbnail art and titles. Sort by date or price, search by name, click any
              card for details.
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-base text-[var(--color-accent-blue)] group-hover:underline">
              Browse games →
            </span>
          </Link>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">Where does the data come from?</h2>
        <ul className="space-y-3 text-base text-[var(--color-text-muted)]">
          <li>
            <strong className="text-[var(--color-text)]">Manifest archive:</strong> Community-uploaded
            files via the Epic-Unlocker backend. Each manifest has a unique{" "}
            <code className="mono text-sm">effective_id</code> — the canonical lookup key
            for downloading and inspecting it.
          </li>
          <li>
            <strong className="text-[var(--color-text)]">Game catalog:</strong> Pulled live
            from the official Epic Games GraphQL endpoint via a CORS proxy. Always
            up-to-date with whatever Epic's servers are showing.
          </li>
        </ul>
      </section>

      <section className="text-sm text-[var(--color-text-muted)] border-t border-white/10 pt-4">
        Open-source on{" "}
        <a
          href="https://github.com/acidicoala/EpicDB#readme"
          target="_blank"
          rel="noreferrer noopener"
          className="text-[var(--color-accent-blue)] hover:underline"
        >
          GitHub
        </a>
        .
      </section>
    </div>
  );
}
