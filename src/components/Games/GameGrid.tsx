import { GameCard } from './GameCard';
import { Game } from '@/lib/api';

interface GameGridProps {
  games: Game[];
  loading?: boolean;
}

export function GameGrid({ games, loading }: GameGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="aspect-video bg-muted rounded-lg loading-shimmer" />
            <div className="space-y-2 p-4">
              <div className="h-6 bg-muted rounded loading-shimmer" />
              <div className="h-4 bg-muted rounded loading-shimmer w-3/4" />
              <div className="h-4 bg-muted rounded loading-shimmer w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <span className="text-2xl">🎮</span>
        </div>
        <h3 className="text-lg font-semibold mb-2">Oyun bulunamadı</h3>
        <p className="text-muted-foreground">
          Arama kriterlerinizi değiştirmeyi deneyin.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {games.map((game, index) => (
        <GameCard key={game.slug} game={game} index={index} />
      ))}
    </div>
  );
}