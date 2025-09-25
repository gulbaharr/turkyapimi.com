import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Users,
  ExternalLink,
  Globe,
  Image as ImageIcon,
  Facebook,
  Instagram,
  Link as LinkIcon,
  MessageCircle,
  Twitch,
  Twitter,
  Youtube,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import {
  fetchGame,
  fetchGames,
  getImageUrl,
  type GameDetail,
  type Game,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GameGrid } from "@/components/Games/GameGrid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";

type LinkGroup = "social" | "video" | "other";

interface LinkMeta {
  url: string;
  label: string;
  Icon: LucideIcon;
  group: LinkGroup;
}

const LINK_MATCHERS: Array<{
  domains: string[];
  label: string;
  Icon: LucideIcon;
  group: LinkGroup;
}> = [
  {
    domains: ["facebook.com"],
    label: "Facebook",
    Icon: Facebook,
    group: "social",
  },
  {
    domains: ["instagram.com"],
    label: "Instagram",
    Icon: Instagram,
    group: "social",
  },
  {
    domains: ["twitter.com", "x.com"],
    label: "Twitter",
    Icon: Twitter,
    group: "social",
  },
  {
    domains: ["discord.gg", "discord.com"],
    label: "Discord",
    Icon: MessageCircle,
    group: "social",
  },
  {
    domains: ["youtube.com", "youtu.be"],
    label: "YouTube",
    Icon: Youtube,
    group: "video",
  },
  { domains: ["twitch.tv"], label: "Twitch", Icon: Twitch, group: "video" },
  {
    domains: ["store.steampowered.com"],
    label: "Steam",
    Icon: ExternalLink,
    group: "other",
  },
  { domains: ["itch.io"], label: "itch.io", Icon: Globe, group: "other" },
  {
    domains: ["gamejolt.com"],
    label: "Game Jolt",
    Icon: Globe,
    group: "other",
  },
  {
    domains: ["apps.apple.com"],
    label: "App Store",
    Icon: Globe,
    group: "other",
  },
  {
    domains: ["play.google.com"],
    label: "Google Play",
    Icon: Globe,
    group: "other",
  },
];

const decodeHtmlEntities = (value: string) => value.replace(/&amp;/gi, "&");

const normalizeUrl = (value: string) => {
  try {
    return new URL(decodeHtmlEntities(value).trim()).href;
  } catch {
    return null;
  }
};

const classifyExternalLink = (
  url: string,
  labelHint?: string,
): LinkMeta | null => {
  const normalized = normalizeUrl(url);
  if (!normalized) {
    return null;
  }

  let hostname = "";
  try {
    hostname = new URL(normalized).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    hostname = "";
  }

  const trimmedLabel = labelHint?.trim();

  for (const matcher of LINK_MATCHERS) {
    if (matcher.domains.some((domain) => hostname.includes(domain))) {
      return {
        url: normalized,
        label: trimmedLabel || matcher.label,
        Icon: matcher.Icon,
        group: matcher.group,
      };
    }
  }

  const fallbackLabel = trimmedLabel || hostname || "Baglanti";
  return {
    url: normalized,
    label: fallbackLabel,
    Icon: LinkIcon,
    group: "other",
  };
};

export default function GameDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [game, setGame] = useState<GameDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [relatedGames, setRelatedGames] = useState<Game[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(false);

  useEffect(() => {
    const loadGame = async () => {
      if (!slug) return;

      setLoading(true);

      try {
        const gameData = await fetchGame(slug);

        setGame(gameData);
      } catch (error) {
        console.error("Error loading game:", error);

        toast({
          title: "Hata",

          description: "Oyun bilgileri yüklenirken bir hata oluştu.",

          variant: "destructive",
        });

        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    loadGame();
  }, [slug, navigate]);

  useEffect(() => {
    if (!game) {
      setRelatedGames([]);

      return;
    }

    if (!game.etiketler || game.etiketler.length === 0) {
      setRelatedGames([]);

      return;
    }

    let isCancelled = false;

    const loadRelatedGames = async () => {
      setRelatedLoading(true);

      try {
        const response = await fetchGames(
          1,
          "",
          game.etiketler.map((tag) => tag.slug),
        );

        if (isCancelled) {
          return;
        }

        const filteredGames = response.results

          .filter((relatedGame) => relatedGame.slug !== game.slug)

          .slice(0, 4);

        setRelatedGames(filteredGames);
      } catch (error) {
        console.error("Error loading related games:", error);

        if (!isCancelled) {
          setRelatedGames([]);
        }
      } finally {
        if (!isCancelled) {
          setRelatedLoading(false);
        }
      }
    };

    loadRelatedGames();

    return () => {
      isCancelled = true;
    };
  }, [game]);

  const primaryExternalLink =
    game?.linkler?.find((link) =>
      link.url.includes("store.steampowered.com"),
    ) ?? game?.linkler?.[0];

  const getLinkLabel = (link?: { url: string; isim?: string }) => {
    if (!link) return null;
    if (link.isim) return link.isim;

    const normalized = normalizeUrl(link.url);
    if (!normalized) {
      return "Open Link";
    }

    if (normalized.includes("store.steampowered.com")) {
      return "View on Steam";
    }

    try {
      const hostname = new URL(normalized).hostname.replace(/^www\./, "");
      return hostname || "Open Link";
    } catch {
      return "Open Link";
    }
  };

  const primaryExternalLabel = getLinkLabel(primaryExternalLink);
  const normalizedPrimaryLink = primaryExternalLink
    ? normalizeUrl(primaryExternalLink.url)
    : null;

  const externalLinks = useMemo(() => {
    if (!game) {
      return {
        social: [] as LinkMeta[],
        video: [] as LinkMeta[],
        other: [] as LinkMeta[],
      };
    }

    const groups: { social: LinkMeta[]; video: LinkMeta[]; other: LinkMeta[] } =
      {
        social: [],
        video: [],
        other: [],
      };

    const seen = new Map<string, LinkMeta>();

    const pushLink = (rawUrl?: string, labelHint?: string) => {
      if (!rawUrl) {
        return;
      }

      const meta = classifyExternalLink(rawUrl, labelHint);
      if (!meta) {
        return;
      }

      if (normalizedPrimaryLink && meta.url === normalizedPrimaryLink) {
        return;
      }

      if (seen.has(meta.url)) {
        return;
      }

      seen.set(meta.url, meta);
    };

    game?.linkler?.forEach((link) => pushLink(link.url, link.isim));
    game?.sosyal_medya?.forEach((link) => pushLink(link.url, link.platform));
    game?.diger_linkler?.forEach((link) => pushLink(link.url, link.isim));
    game?.gameplays?.forEach((item, index) => {
      const label = item.shortened_link
        ? `Gameplay ${index + 1}`
        : `Gameplay Video ${index + 1}`;
      pushLink(item.link, label);
    });

    for (const meta of seen.values()) {
      groups[meta.group].push(meta);
    }

    return groups;
  }, [game, normalizedPrimaryLink]);

  const hasExternalLinks =
    externalLinks.social.length > 0 ||
    externalLinks.video.length > 0 ||
    externalLinks.other.length > 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <div className="h-10 w-32 bg-muted rounded loading-shimmer mb-4" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="aspect-video bg-muted rounded-lg loading-shimmer mb-6" />

              <div className="space-y-4">
                <div className="h-8 bg-muted rounded loading-shimmer w-3/4" />

                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded loading-shimmer" />

                  <div className="h-4 bg-muted rounded loading-shimmer" />

                  <div className="h-4 bg-muted rounded loading-shimmer w-2/3" />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="h-64 bg-muted rounded loading-shimmer" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!game) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}

        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 hover:bg-secondary"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Geri Dön
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-8">
          {/* Main Content */}

          <div className="lg:col-span-2 space-y-6">
            {/* Game Image */}

            <div className="aspect-video relative overflow-hidden rounded-lg border">
              {!imageError ? (
                <img
                  src={getImageUrl(game.resim)}
                  alt={game.isim}
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
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

          {/* Sidebar */}

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

        </div>

        {(relatedLoading || relatedGames.length > 0) && (
          <section className="mt-10 space-y-4">
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
        )}
      </div>
    </div>
  );
}
