import { Calendar, Users, Globe, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { GameDetail } from "@/lib/api";

interface LinkMeta {
  url: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  group: "social" | "video" | "other";
}

interface GameInfoProps {
  game: GameDetail;
  externalLinks: {
    social: LinkMeta[];
    video: LinkMeta[];
    other: LinkMeta[];
  };
  hasExternalLinks: boolean;
}

export function GameInfo({ game, externalLinks, hasExternalLinks }: GameInfoProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Oyun Bilgileri</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-start space-x-3">
            <Users className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />

            <div>
              <p className="text-sm text-muted-foreground">Gelistirici</p>

              <p className="font-medium">
                {game.gelistiriciler.map((dev) => dev.isim).join(", ")}
              </p>
            </div>
          </div>

          <Separator />

          <div className="flex items-start space-x-3">
            <Globe className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />

            <div>
              <p className="text-sm text-muted-foreground">Yayinlayan</p>

              <p className="font-medium">
                {game.yayinlayanlar.map((pub) => pub.isim).join(", ")}
              </p>
            </div>
          </div>

          <Separator />

          <div className="flex items-start space-x-3">
            <Calendar className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />

            <div>
              <p className="text-sm text-muted-foreground">
                Cikis Tarihi
              </p>

              <p className="font-medium">{game.cikis_tarihi}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Etiketler</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="flex flex-wrap gap-2">
            {game.etiketler.map((tag) => (
              <Link key={tag.slug} to={`/?tags=${tag.slug}`}>
                <Badge
                  variant="secondary"
                  className="cursor-pointer hover:bg-primary/10 transition-colors"
                >
                  {tag.isim}
                </Badge>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {hasExternalLinks && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ExternalLink className="w-5 h-5 text-primary" />

              <span>Baglantilar</span>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {externalLinks.social.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Sosyal Medya</h4>

                <div className="flex flex-wrap gap-2">
                  {externalLinks.social.map((link) => {
                    const Icon = link.Icon;

                    return (
                      <Button
                        key={link.url}
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2"
                        >
                          <Icon className="h-4 w-4" />

                          <span>{link.label}</span>

                          <ExternalLink className="h-3 w-3 opacity-70" />
                        </a>
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}

            {externalLinks.video.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Video</h4>

                <div className="flex flex-wrap gap-2">
                  {externalLinks.video.map((link) => {
                    const Icon = link.Icon;

                    return (
                      <Button
                        key={link.url}
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2"
                        >
                          <Icon className="h-4 w-4" />

                          <span>{link.label}</span>

                          <ExternalLink className="h-3 w-3 opacity-70" />
                        </a>
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}

            {externalLinks.other.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Diger Baglantilar</h4>

                <div className="flex flex-wrap gap-2">
                  {externalLinks.other.map((link) => {
                    const Icon = link.Icon;

                    return (
                      <Button
                        key={link.url}
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2"
                        >
                          <Icon className="h-4 w-4" />

                          <span>{link.label}</span>

                          <ExternalLink className="h-3 w-3 opacity-70" />
                        </a>
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="pt-6">
          <div className="text-center">
            <h3 className="font-semibold mb-2">
              Bu oyunu begendiniz mi?
            </h3>

            <p className="text-sm text-muted-foreground mb-4">
              Turk yapimi daha fazla oyun kesfedin!
            </p>

            <Button asChild className="w-full">
              <Link to="/">Daha Fazla Oyun Kesfet</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
