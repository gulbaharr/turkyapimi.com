import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Sparkles, Filter, Gamepad2, Flame } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import {
  fetchGames,
  fetchTags,
  getImageUrl,
  type ApiResponse,
  type Game,
  type Tag,
} from "@/lib/api";

import { Navbar } from "@/components/Layout/Navbar";
import { FilterSidebar } from "@/components/Layout/FilterSidebar";
import { GameGrid } from "@/components/Games/GameGrid";
import { Pagination } from "@/components/Games/Pagination";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

export default function Index() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalGames: 0,
  });

  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);

  const lastSyncedSearchRef = useRef<string>("");
  const latestRequestRef = useRef(0);

  const featuredTags = allTags.slice(0, 8);
  const debouncedSearch = useDebouncedValue(searchInput, 350);
  const activeFilterCount = selectedTags.length + (searchQuery.trim() ? 1 : 0);
  const isSearching = searchQuery.trim().length > 0;
  const popularGames = useMemo(() => games.slice(0, 6), [games]);
  const [activePopularIndex, setActivePopularIndex] = useState(0);
  const activePopularGame = popularGames[activePopularIndex];

  useEffect(() => {
    setActivePopularIndex(0);
  }, [popularGames]);

  useEffect(() => {
    if (popularGames.length <= 1) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setActivePopularIndex((previous) => {
        const nextIndex = previous + 1;
        return nextIndex >= popularGames.length ? 0 : nextIndex;
      });
    }, 4000);

    return () => window.clearInterval(intervalId);
  }, [popularGames.length]);

  const heroImage = activePopularGame
    ? getImageUrl(activePopularGame.resim)
    : null;
  const showPopularSkeleton = loading && games.length === 0;
  const showPopularEmptyState = !loading && popularGames.length === 0;

  const formatNumber = (value: number) =>
    new Intl.NumberFormat("tr-TR").format(value);

  const getTagLabel = (slug: string) =>
    allTags.find((tag) => tag.slug === slug)?.isim ?? slug;

  const scrollToGames = () => {
    const element = document.getElementById("game-results");

    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.scrollTo({ top: window.innerHeight, behavior: "smooth" });
    }
  };

  const updateURL = useCallback(
    (newPage: number, newSearch: string, newTags: string[]) => {
      const params = new URLSearchParams();

      if (newPage > 1) params.set("page", newPage.toString());
      if (newSearch) params.set("search", newSearch);
      if (newTags.length > 0) params.set("tags", newTags.join(","));

      setSearchParams(params);
    },
    [setSearchParams],
  );

  // Auto-open sidebar on desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(true);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const loadTags = async () => {
      try {
        const tags = await fetchTags();
        setAllTags(tags);
      } catch (error) {
        console.error("Error loading featured tags:", error);
      } finally {
        setFeaturedLoading(false);
      }
    };

    loadTags();
  }, []);

  // Load state from URL params
  useEffect(() => {
    const page = parseInt(searchParams.get("page") || "1", 10);
    const search = searchParams.get("search") || "";
    const tags = searchParams.get("tags")?.split(",").filter(Boolean) || [];

    setPagination((prev) =>
      prev.currentPage === page ? prev : { ...prev, currentPage: page },
    );

    setSelectedTags((prev) => {
      if (
        prev.length === tags.length &&
        prev.every((tag, index) => tag === tags[index])
      ) {
        return prev;
      }
      return tags;
    });

    if (search !== lastSyncedSearchRef.current) {
      lastSyncedSearchRef.current = search;
      setSearchQuery(search);
      setSearchInput(search);
    }
  }, [searchParams]);

  // Sync debounced input with active search query
  useEffect(() => {
    if (debouncedSearch === searchQuery) {
      return;
    }

    setPagination((prev) => ({ ...prev, currentPage: 1 }));
    setSearchQuery(debouncedSearch);
    lastSyncedSearchRef.current = debouncedSearch;
    updateURL(1, debouncedSearch, selectedTags);
  }, [debouncedSearch, searchQuery, selectedTags, updateURL]);

  // Load games when filters change
  useEffect(() => {
    const requestId = ++latestRequestRef.current;
    setLoading(true);

    const loadGames = async () => {
      try {
        const response: ApiResponse<Game> = await fetchGames(
          pagination.currentPage,
          searchQuery,
          selectedTags,
        );

        if (latestRequestRef.current !== requestId) {
          return;
        }

        setGames(response.results);
        const gamesPerPage = 20; // API default
        const totalPages = Math.ceil(response.count / gamesPerPage);

        setPagination((prev) => ({
          ...prev,
          totalPages,
          totalGames: response.count,
        }));
      } catch (error) {
        if (latestRequestRef.current !== requestId) {
          return;
        }

        console.error("Error loading games:", error);
        toast({
          title: "Hata",
          description: "Oyunlar yuklenirken bir hata olustu.",
          variant: "destructive",
        });
      } finally {
        if (latestRequestRef.current === requestId) {
          setLoading(false);
        }
      }
    };

    loadGames();
  }, [pagination.currentPage, searchQuery, selectedTags]);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchInput(value);

      if (value === "") {
        setPagination((prev) => ({ ...prev, currentPage: 1 }));
        setSearchQuery("");
        lastSyncedSearchRef.current = "";
        updateURL(1, "", selectedTags);
      }
    },
    [selectedTags, updateURL],
  );

  const handleSearchSubmit = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      setSearchInput(trimmed);
      setPagination((prev) => ({ ...prev, currentPage: 1 }));
      setSearchQuery(trimmed);
      lastSyncedSearchRef.current = trimmed;
      updateURL(1, trimmed, selectedTags);
    },
    [selectedTags, updateURL],
  );

  const handleTagsChange = useCallback(
    (tags: string[]) => {
      setPagination((prev) => ({ ...prev, currentPage: 1 }));
      setSelectedTags(tags);
      updateURL(1, searchQuery, tags);
    },
    [searchQuery, updateURL],
  );

  const handleFeaturedTagClick = (tagSlug: string) => {
    const isActive = selectedTags.includes(tagSlug);
    const nextTags = isActive
      ? selectedTags.filter((slug) => slug !== tagSlug)
      : [...selectedTags, tagSlug];

    handleTagsChange(nextTags);
    if (!isActive && window.innerWidth < 768) {
      setSidebarOpen(true);
    }
  };

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, currentPage: page }));
    updateURL(page, searchQuery, selectedTags);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const getResultText = () => {
    if (loading) return "";
    const { totalGames, currentPage } = pagination;
    const gamesPerPage = 20;
    const startIndex = (currentPage - 1) * gamesPerPage + 1;
    const endIndex = Math.min(currentPage * gamesPerPage, totalGames);

    let text = `${formatNumber(totalGames)} oyun`;
    if (totalGames > gamesPerPage) {
      text += ` (${formatNumber(startIndex)}-${formatNumber(endIndex)} arası gösteriliyor)`;
    }
    if (searchQuery.trim()) {
      text += ` "${searchQuery}" için`;
    }
    if (selectedTags.length > 0) {
      text += " seçili etiketler için";
    }
    return text;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar
        searchValue={searchInput}
        onSearchChange={handleSearchChange}
        onSearchSubmit={handleSearchSubmit}
        onToggleSidebar={toggleSidebar}
      />

      <div className="flex">
        <FilterSidebar
          selectedTags={selectedTags}
          onTagsChange={handleTagsChange}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <main className="flex-1 min-h-screen">
          <div className="container mx-auto px-4 py-8">
            {!isSearching && (
              <section className="mb-10 space-y-8">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                  <div className="space-y-3">
                    <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                      <Flame className="h-4 w-4" />
                      Populer oyunlar
                    </span>
                    <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                      Toplulugun favori Turk yapimi oyunlari
                    </h1>
                    <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
                      Son donemde en cok ilgi ceken projeleri derledik. Steam
                      vitrinlerini ve topluluk linklerini tek yerden incele.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 border-border text-foreground hover:bg-muted/60"
                      onClick={scrollToGames}
                    >
                      <Gamepad2 className="h-4 w-4" />
                      Tum oyunlar
                    </Button>
                    <Button
                      size="sm"
                      className="gap-2"
                      onClick={() => setSidebarOpen(true)}
                    >
                      <Filter className="h-4 w-4" />
                      Filtreleri ac
                    </Button>
                  </div>
                </div>
                {showPopularSkeleton ? (
                  <div className="h-[360px] w-full animate-pulse rounded-3xl border border-dashed border-muted bg-muted/40" />
                ) : showPopularEmptyState ? (
                  <div className="rounded-3xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                    Populer oyunlari su anda yukleyemiyoruz. Daha sonra tekrar
                    dene.
                  </div>
                ) : (
                  activePopularGame && (
                    <motion.div 
                      className="relative overflow-hidden rounded-3xl border bg-card text-card-foreground shadow-xl"
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={activePopularGame.slug}
                          className="absolute inset-0"
                          style={{
                            backgroundImage: heroImage
                              ? `linear-gradient(200deg, rgba(10,10,12,0.2) 0%, rgba(10,10,12,0.85) 70%), url(${heroImage})`
                              : undefined,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                          }}
                          initial={{ opacity: 0, scale: 1.1 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 1, ease: "easeInOut" }}
                        />
                      </AnimatePresence>

                      <div className="relative z-10 flex min-h-[340px] flex-col justify-end gap-5 p-6 sm:p-10">
                        <AnimatePresence mode="wait">
                          <motion.div 
                            key={activePopularGame.slug}
                            className="space-y-2"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                          >
                            <motion.span 
                              className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white"
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.4, delay: 0.3 }}
                            >
                              <Sparkles className="h-3 w-3" />
                              Topluluk vitrininde
                            </motion.span>

                            <motion.h2 
                              className="text-3xl font-bold leading-tight text-white sm:text-4xl"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.5, delay: 0.4 }}
                            >
                              {activePopularGame.isim}
                            </motion.h2>

                            <motion.p 
                              className="max-w-2xl text-sm text-white/80 sm:text-base"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ duration: 0.5, delay: 0.5 }}
                            >
                              {activePopularGame.aciklama}
                            </motion.p>
                          </motion.div>
                        </AnimatePresence>

                        <AnimatePresence mode="wait">
                          <motion.div 
                            key={`${activePopularGame.slug}-meta`}
                            className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-wide text-white/70"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.4, delay: 0.6 }}
                          >
                            <span>{activePopularGame.cikis_tarihi || "TBA"}</span>

                            <span className="hidden h-3 w-px bg-white/40 sm:inline-flex" />

                            <span className="line-clamp-1 normal-case text-sm">
                              {activePopularGame.gelistiriciler
                                .map((developer) => developer.isim)
                                .join(", ") || "Bagimsiz ekip"}
                            </span>
                          </motion.div>
                        </AnimatePresence>

                        {activePopularGame.etiketler.length > 0 && (
                          <AnimatePresence mode="wait">
                            <motion.div 
                              key={`${activePopularGame.slug}-tags`}
                              className="flex flex-wrap gap-2"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.4, delay: 0.7 }}
                            >
                              {activePopularGame.etiketler
                                .slice(0, 4)
                                .map((tag, index) => (
                                  <motion.span
                                    key={tag.slug}
                                    className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ 
                                      duration: 0.3, 
                                      delay: 0.8 + index * 0.1 
                                    }}
                                  >
                                    #{tag.isim}
                                  </motion.span>
                                ))}
                            </motion.div>
                          </AnimatePresence>
                        )}

                        <AnimatePresence mode="wait">
                          <motion.div 
                            key={`${activePopularGame.slug}-buttons`}
                            className="flex flex-wrap gap-3"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.4, delay: 0.9 }}
                          >
                            <Button asChild size="lg" className="gap-2">
                              <Link to={`/oyun/${activePopularGame.slug}`}>
                                <Gamepad2 className="h-4 w-4" />
                                Oyunu incele
                              </Link>
                            </Button>

                            <Button
                              variant="outline"
                              size="lg"
                              className="gap-2 border-white/60 text-white hover:bg-white/10"
                              onClick={() => setSidebarOpen(true)}
                            >
                              <Filter className="h-4 w-4" />
                              Filtreleri ac
                            </Button>
                          </motion.div>
                        </AnimatePresence>
                      </div>

                      {popularGames.length > 1 && (
                        <motion.div 
                          className="absolute inset-x-0 bottom-6 flex justify-center gap-2"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.5, delay: 1 }}
                        >
                          {popularGames.map((game, index) => (
                            <motion.button
                              key={game.slug}
                              type="button"
                              aria-label={`${game.isim} on izlemesi`}
                              onClick={() => setActivePopularIndex(index)}
                              className={`h-2 w-2 rounded-full transition ${index === activePopularIndex ? "bg-white" : "bg-white/40 hover:bg-white/70"}`}
                              whileHover={{ scale: 1.2 }}
                              whileTap={{ scale: 0.9 }}
                              initial={{ opacity: 0, scale: 0.5 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ 
                                duration: 0.3, 
                                delay: 1.1 + index * 0.05 
                              }}
                            />
                          ))}
                        </motion.div>
                      )}
                    </motion.div>
                  )
                )}

                <motion.div 
                  className="grid gap-4 md:grid-cols-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 1.2 }}
                >
                  <motion.div 
                    className="rounded-2xl border bg-card p-6 shadow-sm"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 1.3 }}
                    whileHover={{ y: -4, boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}
                  >
                    <motion.div 
                      className="flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.4, delay: 1.4 }}
                    >
                      <span>Toplam oyun</span>
                      <motion.div
                        initial={{ scale: 0, rotate: -90 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ duration: 0.5, delay: 1.5 }}
                      >
                        <Gamepad2 className="h-4 w-4 text-primary" />
                      </motion.div>
                    </motion.div>

                    <motion.p 
                      className="mt-4 text-3xl font-semibold"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, delay: 1.6 }}
                    >
                      {formatNumber(pagination.totalGames)}
                    </motion.p>

                    <motion.p 
                      className="mt-2 text-sm text-muted-foreground"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.4, delay: 1.7 }}
                    >
                      Kutuphanemizde listelenen yapimlar
                    </motion.p>
                  </motion.div>

                  <motion.div 
                    className="rounded-2xl border bg-card p-6 shadow-sm"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 1.4 }}
                    whileHover={{ y: -4, boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}
                  >
                    <motion.div 
                      className="flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.4, delay: 1.5 }}
                    >
                      <span>Bu sayfada</span>
                      <motion.div
                        initial={{ scale: 0, rotate: -90 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ duration: 0.5, delay: 1.6 }}
                      >
                        <Sparkles className="h-4 w-4 text-primary" />
                      </motion.div>
                    </motion.div>

                    <motion.p 
                      className="mt-4 text-3xl font-semibold"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, delay: 1.7 }}
                    >
                      {loading ? "..." : formatNumber(games.length)}
                    </motion.p>

                    <motion.p 
                      className="mt-2 text-sm text-muted-foreground"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.4, delay: 1.8 }}
                    >
                      Su anda gosterilen sonuclar
                    </motion.p>
                  </motion.div>

                  <motion.div 
                    className="rounded-2xl border bg-card p-6 shadow-sm"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 1.5 }}
                    whileHover={{ y: -4, boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}
                  >
                    <motion.div 
                      className="flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.4, delay: 1.6 }}
                    >
                      <span>Aktif filtre</span>
                      <motion.div
                        initial={{ scale: 0, rotate: -90 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ duration: 0.5, delay: 1.7 }}
                      >
                        <Filter className="h-4 w-4 text-primary" />
                      </motion.div>
                    </motion.div>

                    <motion.p 
                      className="mt-4 text-3xl font-semibold"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, delay: 1.8 }}
                    >
                      {formatNumber(activeFilterCount)}
                    </motion.p>

                    <motion.p 
                      className="mt-2 text-sm text-muted-foreground"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.4, delay: 1.9 }}
                    >
                      Arama ve etiket kombinasyonlari
                    </motion.p>
                  </motion.div>
                </motion.div>
              </section>
            )}

            <section id="game-results" className="mb-8 space-y-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold">
                    {isSearching ? `"${searchQuery}" araması` : "Tüm Oyunlar"}
                  </h2>

                  <p className="text-sm text-muted-foreground">
                    {getResultText()}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {searchQuery.trim() && (
                    <Badge
                      variant="outline"
                      className="border-primary/40 bg-primary/10 text-primary hover:bg-primary/15"
                    >
                      Arama: {searchQuery}
                    </Badge>
                  )}

                  {selectedTags.map((tagSlug) => (
                    <Badge
                      key={tagSlug}
                      variant="secondary"
                      className="cursor-pointer bg-muted text-foreground hover:bg-muted/80"
                      onClick={() =>
                        handleTagsChange(
                          selectedTags.filter((slug) => slug !== tagSlug),
                        )
                      }
                    >
                      #{getTagLabel(tagSlug)}
                    </Badge>
                  ))}

                  {!searchQuery.trim() && selectedTags.length === 0 && (
                    <span className="text-sm text-muted-foreground">
                      Filtre uygulanmadı
                    </span>
                  )}
                </div>
              </div>
            </section>

            <GameGrid games={games} loading={loading} />

            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
