import type { GameCardData } from "~/hooks/useGameSearch";
import { GameCard, CARD_MIN_WIDTH } from "./GameCard";

/**
 * Responsive grid of game cards. Auto-fills with the minimum card width,
 * so it lays out 4 cards per row at ~1280px and gracefully degrades on
 * narrower viewports.
 */
export function GameGrid({
  games,
}: {
  games: GameCardData[];
}) {
  if (games.length === 0) return null;
  return (
    <div
      className="grid gap-4"
      style={{
        gridTemplateColumns: `repeat(auto-fill, minmax(${CARD_MIN_WIDTH}px, 1fr))`,
      }}
    >
      {games.map((g) => (
        <GameCard key={g.id} game={g} />
      ))}
    </div>
  );
}
