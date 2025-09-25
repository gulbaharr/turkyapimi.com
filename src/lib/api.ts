import axios from "axios";

// Base URL uses same-origin API in production; dev proxy handles localhost requests
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

export interface Game {
  slug: string;
  isim: string;
  aciklama: string;
  resim: string;
  gelistiriciler: Array<{ isim: string }>;
  yayinlayanlar: Array<{ isim: string }>;
  cikis_tarihi: string;
  etiketler: Array<{ slug: string; isim: string }>;
  linkler?: Array<{ url: string; isim?: string }>;
}

export interface GameDetail extends Game {
  uzun_aciklama?: string;
  ekran_goruntuleri?: string[];
  sosyal_medya?: Array<{ platform: string; url: string }>;
  diger_linkler?: Array<{ isim: string; url: string }>;
  gameplays?: Array<{ link: string; shortened_link?: string }>;
}

export interface Tag {
  slug: string;
  isim: string;
  id?: number;
}

export interface ApiResponse<T> {
  count: number;
  next?: string;
  previous?: string;
  results: T[];
}

// Create axios instance with default config
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000, // Allow extra time for remote API responses
  headers: {
    Accept: "application/json",
  },
});

type RawTag = Pick<Tag, "slug" | "isim">;

let cachedTags: Tag[] | null = null;
let tagFetchPromise: Promise<Tag[]> | null = null;
const slugToTag = new Map<string, Tag>();

interface TitleSearchCacheEntry {
  games: Game[];
  pageSize: number;
  fetchedAt: number;
}

const TITLE_SEARCH_CACHE_TTL = 1000 * 60 * 5; // 5 minutes
const MAX_TITLE_SEARCH_PAGES = 25;
const API_PAGE_SIZE_FALLBACK = 20;

const titleSearchCache = new Map<string, TitleSearchCacheEntry>();

const decodeHtmlEntities = (value: string) =>
  value
    .replace(/&#(\d+);/g, (_, code: string) =>
      String.fromCharCode(Number.parseInt(code, 10)),
    )
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) =>
      String.fromCharCode(Number.parseInt(code, 16)),
    )
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");

const normalizeLabel = (value: string) =>
  decodeHtmlEntities(value).trim().toLocaleLowerCase("tr-TR");

const normalizeSearchTerm = (value: string) => value.toLocaleLowerCase("tr-TR");

const parseTagIdMapFromFilterHtml = (html: string) => {
  const map = new Map<string, number>();
  if (!html) {
    return map;
  }

  const selectMatch = html.match(
    /<select[^>]+name="etiketler"[^>]*>([\s\S]*?)<\/select>/i,
  );
  if (!selectMatch) {
    return map;
  }

  const optionRegex = /<option value="(\d+)">([^<]+)<\/option>/gi;
  let optionMatch: RegExpExecArray | null;

  while ((optionMatch = optionRegex.exec(selectMatch[1])) !== null) {
    const id = Number.parseInt(optionMatch[1], 10);
    if (Number.isNaN(id)) {
      continue;
    }

    const label = normalizeLabel(optionMatch[2]);
    if (!label || map.has(label)) {
      continue;
    }

    map.set(label, id);
  }

  return map;
};

const buildTagCache = async (): Promise<Tag[]> => {
  const [tagsResponse, filterResponse] = await Promise.all([
    api.get<RawTag[]>("/etiketler/"),
    api
      .get<string>("/oyunlar/", {
        params: { format: "api" },
        responseType: "text",
        transformResponse: (value) => value,
        headers: { Accept: "text/html,application/xhtml+xml" },
      })
      .catch((error) => {
        console.warn("Failed to load tag metadata:", error);
        return { data: "" } as const;
      }),
  ]);

  const idMap = parseTagIdMapFromFilterHtml(
    typeof filterResponse?.data === "string" ? filterResponse.data : "",
  );

  const tags = tagsResponse.data.map<Tag>((tag) => {
    const normalizedName = normalizeLabel(tag.isim);
    const id = idMap.get(normalizedName);
    const enriched: Tag = {
      ...tag,
      ...(typeof id === "number" ? { id } : {}),
    };
    return enriched;
  });

  slugToTag.clear();
  tags.forEach((tag) => {
    slugToTag.set(tag.slug, tag);
  });

  return tags;
};

const getTagIdsFromSlugs = async (slugs: string[]): Promise<number[]> => {
  if (slugs.length === 0) {
    return [];
  }

  await fetchTags();

  const seen = new Set<number>();

  slugs.forEach((slug) => {
    const tag = slugToTag.get(slug);
    if (tag?.id !== undefined) {
      seen.add(tag.id);
    }
  });

  return Array.from(seen);
};

const isCacheEntryFresh = (entry: TitleSearchCacheEntry) =>
  Date.now() - entry.fetchedAt < TITLE_SEARCH_CACHE_TTL;

const collectTitleSearchMatches = async (
  baseParams: URLSearchParams,
  searchTerm: string,
): Promise<{ games: Game[]; pageSize: number }> => {
  const matches: Game[] = [];
  const seen = new Set<string>();
  let apiPage = 1;
  let pageSize = API_PAGE_SIZE_FALLBACK;

  while (apiPage <= MAX_TITLE_SEARCH_PAGES) {
    const params = new URLSearchParams(baseParams);
    params.set("page", apiPage.toString());
    const url = `/oyunlar/?${params.toString()}`;
    const response = await api.get<ApiResponse<Game>>(url);
    const { results = [], next } = response.data;

    if (apiPage === 1 && results.length > 0) {
      pageSize = results.length;
    }

    results.forEach((game) => {
      const title = normalizeSearchTerm(game.isim ?? "");
      if (!seen.has(game.slug) && title.includes(searchTerm)) {
        seen.add(game.slug);
        matches.push(game);
      }
    });

    if (!next) {
      break;
    }

    apiPage += 1;

    if (apiPage > MAX_TITLE_SEARCH_PAGES) {
      console.warn(
        "Reached max page limit while filtering title search results",
      );
    }
  }

  return { games: matches, pageSize };
};

// Helper function to get image URL
export const getImageUrl = (filename: string) => {
  if (!filename) return "/placeholder.svg";
  if (filename.startsWith("http")) return filename;
  // Direct image URLs don't need CORS proxy
  return `https://turkyapimi.com/static/game_images/${filename}`;
};

// API functions
export const fetchGames = async (
  page = 1,
  search = "",
  tags: string[] = [],
): Promise<ApiResponse<Game>> => {
  try {
    const trimmedSearch = search.trim();
    const baseParams = new URLSearchParams();

    if (trimmedSearch) {
      baseParams.set("search", trimmedSearch);
    }

    if (tags.length > 0) {
      const tagIds = await getTagIdsFromSlugs(tags);
      if (tagIds.length > 0) {
        tagIds
          .sort((a, b) => a - b)
          .forEach((id) => baseParams.append("etiketler", id.toString()));
      } else {
        [...tags]
          .sort((a, b) => a.localeCompare(b, "tr-TR"))
          .forEach((slug) => baseParams.append("etiketler__slug", slug));
      }
    }

    const searchTerm = trimmedSearch ? normalizeSearchTerm(trimmedSearch) : "";

    if (!searchTerm) {
      if (page > 1) {
        baseParams.set("page", page.toString());
      }

      const query = baseParams.toString();
      const url = query ? `/oyunlar/?${query}` : "/oyunlar/";
      const response = await api.get(url);
      return response.data;
    }

    const cacheKeyParts = Array.from(baseParams.entries())
      .filter(([key]) => key !== "page")
      .map(([key, value]) => `${key}=${value}`)
      .sort();
    const cacheKey = `${searchTerm}|${cacheKeyParts.join("&")}`;

    let cacheEntry = titleSearchCache.get(cacheKey);

    if (!cacheEntry || !isCacheEntryFresh(cacheEntry)) {
      const { games, pageSize } = await collectTitleSearchMatches(
        baseParams,
        searchTerm,
      );
      cacheEntry = {
        games,
        pageSize,
        fetchedAt: Date.now(),
      };
      titleSearchCache.set(cacheKey, cacheEntry);
    }

    const { games, pageSize } = cacheEntry;
    const effectivePageSize = pageSize || API_PAGE_SIZE_FALLBACK;
    const total = games.length;
    const totalPages =
      effectivePageSize > 0 ? Math.ceil(total / effectivePageSize) : 1;

    const startIndex = Math.max(0, (page - 1) * effectivePageSize);
    const pageResults =
      startIndex < total
        ? games.slice(startIndex, startIndex + effectivePageSize)
        : [];

    return {
      count: total,
      next: page < totalPages ? "title-search" : undefined,
      previous: page > 1 ? "title-search" : undefined,
      results: pageResults,
    };
  } catch (error) {
    console.error("Error fetching games:", error);
    throw error;
  }
};

export const fetchGame = async (slug: string): Promise<GameDetail> => {
  try {
    const response = await api.get(`/oyun/${slug}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching game ${slug}:`, error);
    throw error;
  }
};

export const fetchTags = async (): Promise<Tag[]> => {
  if (cachedTags) {
    return cachedTags;
  }

  if (!tagFetchPromise) {
    tagFetchPromise = buildTagCache()
      .then((tags) => {
        cachedTags = tags;
        return tags;
      })
      .catch((error) => {
        cachedTags = null;
        throw error;
      })
      .finally(() => {
        tagFetchPromise = null;
      });
  }

  return tagFetchPromise as Promise<Tag[]>;
};
