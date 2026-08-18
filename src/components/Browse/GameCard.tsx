import { Link } from "react-router";
import type { GameCardData } from "~/hooks/useGameSearch";
import { routes } from "~/components/Header";

/** Card min-width — sized so 4 cards fit comfortably on a 1280px viewport. */
export const CARD_MIN_WIDTH = 240;

/**
 * A single game card — image on top (3:4 aspect), title below, hover for
 * light-blue outline highlight. Clicking the card navigates to the standalone
 * game detail page (/browse/:namespace) — no modal.
 */
export function GameCard({ game }: { game: GameCardData }) {
  return (
    <Link
      to={routes.game.replace(":namespace", game.namespace)}
      className="group flex flex-col text-left transition-transform hover:-translate-y-0.5"
      title={game.title}
    >
      <div className="aspect-[3/4] w-full overflow-hidden rounded-lg border border-white/10 bg-[var(--color-base-3)] transition-colors group-hover:border-[var(--color-accent-blue)] group-hover:shadow-[0_0_0_2px_var(--color-accent-blue)]">
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
          <div className="flex h-full w-full items-center justify-center text-sm text-[var(--color-text-muted)]">
            no image
          </div>
        )}
      </div>
      <div className="mt-3 line-clamp-2 text-base font-medium text-[var(--color-text)]">
        {game.title}
      </div>
    </Link>
  );
}
