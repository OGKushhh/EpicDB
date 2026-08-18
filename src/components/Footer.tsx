/** App footer — disclaimer + key links. */
export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[var(--color-base-2)]/60 py-3 text-center text-xs text-[var(--color-text-muted)]">
      <p className="mx-auto max-w-7xl px-4">
        EpicDB is a hobby project and is not affiliated with Epic Games. ·
        Data sourced from the official Epic Games GraphQL endpoint and the
        Epic-Unlocker manifest database.
      </p>
    </footer>
  );
}
