import { useEffect, useMemo, useState } from 'react';
import { Filter, Search, X } from 'lucide-react';

import { fetchTags, type Tag } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface FilterSidebarProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  isOpen: boolean;
  onClose: () => void;
}

type GroupedTag = {
  group: string;
  items: Tag[];
};

export function FilterSidebar({
  selectedTags,
  onTagsChange,
  isOpen,
  onClose,
}: FilterSidebarProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadTags = async () => {
      try {
        const fetchedTags = await fetchTags();
        setTags(fetchedTags);
      } catch (error) {
        console.error('Error loading tags:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTags();
  }, []);

  const filteredTags = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) {
      return tags;
    }

    return tags.filter((tag) =>
      tag.isim.toLowerCase().includes(query) ||
      tag.slug.toLowerCase().includes(query),
    );
  }, [tags, searchTerm]);

  const groupedTags = useMemo<GroupedTag[]>(() => {
    if (filteredTags.length === 0) {
      return [];
    }

    if (searchTerm.trim()) {
      return [
        {
          group: 'Arama Sonuçları',
          items: [...filteredTags].sort((a, b) => a.isim.localeCompare(b.isim, 'tr')),
        },
      ];
    }

    const groups = filteredTags.reduce<Record<string, Tag[]>>((acc, tag) => {
      const initial = tag.isim.charAt(0).toUpperCase();
      const key = /[A-ZÇĞİÖŞÜ]/.test(initial) ? initial : '#';

      if (!acc[key]) {
        acc[key] = [];
      }

      acc[key].push(tag);
      return acc;
    }, {});

    return Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b, 'tr'))
      .map(([group, items]) => ({
        group,
        items: [...items].sort((a, b) => a.isim.localeCompare(b.isim, 'tr')),
      }));
  }, [filteredTags, searchTerm]);

  const toggleTag = (tagSlug: string) => {
    const newTags = selectedTags.includes(tagSlug)
      ? selectedTags.filter((t) => t !== tagSlug)
      : [...selectedTags, tagSlug];
    onTagsChange(newTags);
  };

  const clearAllTags = () => {
    onTagsChange([]);
  };

  if (!isOpen) return null;

  const isSearching = searchTerm.trim().length > 0;
  const showSectionTitles = !isSearching && groupedTags.length > 1;

  return (
    <>
      {/* Mobile Overlay */}
      <div className="fixed inset-0 z-40 bg-black/20 md:hidden" onClick={onClose} />

      {/* Sidebar */}
      <aside
        className={`
        fixed md:sticky top-16 left-0 h-screen md:h-[calc(100vh-4rem)] w-80
        bg-background border-r z-50 md:z-auto transform transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}
      >
        <div className="flex h-full flex-col">
          <div className="sticky top-0 z-20 border-b bg-background/95 p-4 backdrop-blur">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-primary" />
                <h2 className="font-semibold">Filtreler</h2>
              </div>
              <div className="flex items-center space-x-2">
                {selectedTags.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllTags}
                    className="h-8 text-xs"
                  >
                    Temizle
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-8 w-8 p-0 md:hidden"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Etiketleri seçerek sonuçları daraltın.
            </p>
          </div>

          <div className="border-b bg-background/80 p-4 backdrop-blur">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Etiket ara..."
                className="pl-9"
              />
            </div>
          </div>

          <ScrollArea className="flex-1 p-4">
            {selectedTags.length > 0 && (
              <div className="mb-6">
                <h3 className="mb-3 text-sm font-medium">Seçili Etiketler</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedTags.map((tagSlug) => {
                    const tag = tags.find((t) => t.slug === tagSlug);
                    return tag ? (
                      <Badge
                        key={tagSlug}
                        variant="default"
                        className="cursor-pointer hover:opacity-80"
                        onClick={() => toggleTag(tagSlug)}
                      >
                        {tag.isim}
                        <X className="ml-1 h-3 w-3" />
                      </Badge>
                    ) : null;
                  })}
                </div>
                <Separator className="mt-4" />
              </div>
            )}

            <div className="space-y-4">
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 12 }).map((_, index) => (
                    <div key={index} className="h-8 rounded-lg bg-muted/60" />
                  ))}
                </div>
              ) : groupedTags.length === 0 ? (
                <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  Arama koşullarına uygun etiket bulunamadı.
                </div>
              ) : (
                groupedTags.map(({ group, items }) => (
                  <div key={group} className="space-y-2">
                    {showSectionTitles && (
                      <h4 className="text-xs font-semibold uppercase text-muted-foreground">
                        {group}
                      </h4>
                    )}
                    <div className="space-y-1">
                      {items.map((tag) => (
                        <button
                          key={tag.slug}
                          onClick={() => toggleTag(tag.slug)}
                          className={`w-full rounded-lg p-2 text-left text-sm transition-all duration-200 hover:bg-muted ${
                            selectedTags.includes(tag.slug)
                              ? 'bg-primary text-primary-foreground shadow-sm'
                              : 'text-foreground'
                          }`}
                        >
                          <span className="capitalize">{tag.isim}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </aside>
    </>
  );
}
