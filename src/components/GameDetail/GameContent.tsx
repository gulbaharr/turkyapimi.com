import { ExternalLink, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getImageUrl, type GameDetail } from "@/lib/api";

interface GameContentProps {
  game: GameDetail;
  imageError: boolean;
  onImageError: () => void;
  primaryExternalLink?: { url: string; isim?: string };
  primaryExternalLabel?: string | null;
}

export function GameContent({ 
  game, 
  imageError, 
  onImageError, 
  primaryExternalLink, 
  primaryExternalLabel 
}: GameContentProps) {
  return (
    <div className="space-y-6">
      {/* Game Image */}
      <div className="aspect-video relative overflow-hidden rounded-lg border">
        {!imageError ? (
          <img
            src={getImageUrl(game.resim)}
            alt={game.isim}
            className="w-full h-full object-cover"
            onError={onImageError}
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <ImageIcon className="w-16 h-16 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Game Title & Description */}
      <div>
        <h1 className="text-4xl font-bold mb-4">{game.isim}</h1>

        <p className="text-lg text-muted-foreground leading-relaxed">
          {game.uzun_aciklama || game.aciklama}
        </p>

        {primaryExternalLink && primaryExternalLabel && (
          <Button
            asChild
            size="lg"
            className="mt-6 inline-flex items-center gap-2"
          >
            <a
              href={primaryExternalLink.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="w-4 h-4" />
              {primaryExternalLabel}
            </a>
          </Button>
        )}
      </div>

      {/* Screenshots */}
      {game.ekran_goruntuleri && game.ekran_goruntuleri.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ImageIcon className="w-5 h-5 text-primary" />
              <span>Ekran Goruntuleri</span>
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {game.ekran_goruntuleri.map((screenshot, index) => (
                <div
                  key={index}
                  className="aspect-video relative overflow-hidden rounded-lg"
                >
                  <img
                    src={getImageUrl(screenshot)}
                    alt={`${game.isim} ekran goruntusu ${index + 1}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
