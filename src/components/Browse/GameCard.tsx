import type { GameCardData } from "~/hooks/useGameSearch";

/** Default card dimensions — matches ScreamDB's card aspect ratio (3:4). */
export const CARD_W = 200;
export const CARD_H = 267;

/** A single game card — image on top, title below, hover for highlight. */
export function GameCard({
  game,
  onClick,
}: {
  game: GameCardData;
  onClick: (game: GameCardData) => void;
}) {
  return (
    <button
      onClick={() => onClick(game)}
      className="group flex flex-col text-left transition-transform hover:-translate-y-0.5"
      title={game.title}
    >
      <div
        className="aspect-[3/4] w-full overflow-hidden rounded-md border border-white/10 bg-[var(--color-base-3)] transition-colors group-hover:border-[var(--color-accent)]"
      >
        {game.imageUrl ? (
          <img
            src={game.imageUrl}
            alt={game.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.opacity = "0";
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-[var(--color-text-muted)]">
            no image
          </div>
        )}
      </div>
      <div className="mt-2 line-clamp-2 text-sm font-medium text-[var(--color-text)]">
        {game.title}
      </div>
    </button>
  );
}
