import { GameGrid } from "@/components/Games/GameGrid";
import type { Game } from "@/lib/api";

interface RelatedGamesProps {
  relatedGames: Game[];
  relatedLoading: boolean;
}

export function RelatedGames({ relatedGames, relatedLoading }: RelatedGamesProps) {
  if (!relatedLoading && relatedGames.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Benzer Oyunlar</h2>

        {!relatedLoading && relatedGames.length > 0 && (
          <span className="text-sm text-muted-foreground">
            {relatedGames.length} oyun bulundu
          </span>
        )}
      </div>

      <GameGrid games={relatedGames} loading={relatedLoading} />
    </section>
  );
}
