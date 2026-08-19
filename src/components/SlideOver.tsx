import { useEffect } from "react";

/**
 * Slide-over modal panel that slides in from the right side of the viewport.
 * Used for the manifest GameDetail view so the card grid can take the full
 * width of the page. Backdrop click + Esc key + close button all dismiss.
 *
 * The panel is fixed to the right edge, ~480px wide on desktop, full-width on
 * small screens (becomes a bottom sheet style sheet at <= 640px via the sm:
 * breakpoint, but kept as a right-side panel for simplicity — body has its
 * own scroll).
 */
export function SlideOver({
  open,
  onClose,
  title,
  subtitle,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  // Esc-to-close.
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    // Lock body scroll while the panel is open so the background doesn't move.
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      {/* Backdrop */}
      <button
        aria-label="Close panel"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative flex h-full w-full max-w-[32rem] flex-col border-l border-white/10 bg-[var(--color-base-2)] shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-white/10 px-5 py-4">
          <div className="min-w-0 flex-1">
            <div className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
              {subtitle ?? "Details"}
            </div>
            <h2 className="mt-0.5 text-lg font-semibold break-words">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="btn-ghost !px-3 !py-2 !text-base"
            aria-label="Close"
            title="Close (Esc)"
          >
            ✕
          </button>
        </div>

        {/* Body — own scroll */}
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </aside>
    </div>
  );
}
