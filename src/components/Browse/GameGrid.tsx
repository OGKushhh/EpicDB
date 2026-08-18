import type { GameCardData } from "~/hooks/useGameSearch";
import { GameCard } from "./GameCard";

/** Responsive grid of game cards. Uses CSS grid with auto-fill + min width. */
export function GameGrid({
  games,
  onSelect,
}: {
  games: GameCardData[];
  onSelect: (game: GameCardData) => void;
}) {
  if (games.length === 0) return null;
  return (
    <div
      className="grid gap-4"
      style={{
        gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
      }}
    >
      {games.map((g) => (
        <GameCard key={g.id} game={g} onClick={onSelect} />
      ))}
    </div>
  );
}
