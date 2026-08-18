import { useEffect } from "react";
import type { GameCardData } from "~/hooks/useGameSearch";

/**
 * Modal dialog showing details for a clicked game. Shows the larger image,
 * title, namespace + item IDs (with copy buttons), release date, and a link
 * to the game's Epic Games Store page.
 *
 * Closes on backdrop click or Escape key.
 */
export function GameDetailModal({
  game,
  onClose,
}: {
  game: GameCardData | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!game) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [game, onClose]);

  if (!game) return null;

  const storeUrl = `https://store.epicgames.com/en-US/p/${game.namespace}`;
  const itemsUrl = `https://egdata.app/games/${game.namespace}`;

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("clipboard write failed:", err);
    }
  };

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="card flex max-w-2xl flex-col gap-4 sm:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0">
          <div className="aspect-[3/4] w-40 overflow-hidden rounded-md border border-white/10 bg-[var(--color-base-3)]">
            {game.imageUrl ? (
              <img
                src={game.imageUrl}
                alt={game.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-[var(--color-text-muted)]">
                no image
              </div>
            )}
          </div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div>
            <h2 className="text-lg font-semibold">{game.title}</h2>
            <div className="text-xs text-[var(--color-text-muted)]">
              {game.releaseDate
                ? `Released ${game.releaseDate.toLocaleDateString()}`
                : "Release date unknown"}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2 border-t border-white/10 pt-3 text-xs">
            <CopyableRow label="Item ID" value={game.id} onCopy={copy} />
            <CopyableRow label="Namespace" value={game.namespace} onCopy={copy} />
          </div>
          <div className="mt-auto flex flex-wrap gap-2 border-t border-white/10 pt-3">
            <a
              href={storeUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="btn-primary !text-xs"
            >
              View on Epic Store →
            </a>
            <a
              href={itemsUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="btn-outline !text-xs"
            >
              egdata.app →
            </a>
            <button onClick={onClose} className="btn-ghost !text-xs ml-auto">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CopyableRow({
  label,
  value,
  onCopy,
}: {
  label: string;
  value: string;
  onCopy: (text: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 shrink-0 text-[var(--color-text-muted)]">{label}</div>
      <code className="mono flex-1 break-all text-[var(--color-text)]">{value}</code>
      <button
        onClick={() => onCopy(value)}
        className="btn-ghost !px-2 !py-0.5 !text-xs"
        title="Copy to clipboard"
      >
        ⧉
      </button>
    </div>
  );
}
