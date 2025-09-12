"use client";

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Heart, MessageCircle, Eye, Filter } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { LOGBOOK_TOPICS, getTopicLabel, getTopicIcon } from '@/lib/logbook-topics';
import { getLogbookImage } from '@/lib/storage-helpers';
import { StorageImg } from '@/components/ui/StorageImage';
import LikeButton from '@/components/ui/LikeButton';
import ExploreFilters from '@/components/ExploreFilters';
import { FilterState, filterPostsClientSide, hasActiveFilters, clearFilters, createFilterParams, createFiltersFromParams } from '@/lib/filter-utils';

interface ExplorePost {
  id: string;
  title: string;
  content: string;
  author_handle: string;
  author_avatar_url: string;
  car_brand: string;
  car_model: string;
  car_year: number;
  car_name: string;
  media_preview: string;
  likes_count: number;
  comments_count: number;
  publish_date: string;
}

export default function ExplorePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [entries, setEntries] = useState<ExplorePost[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<ExplorePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [exhausted, setExhausted] = useState(false);
  const [filters, setFilters] = useState<FilterState>(() => 
    createFiltersFromParams(searchParams)
  );

  useEffect(() => {
    loadFeed(true);
  }, []);

  // Применяем фильтры при изменении
  useEffect(() => {
    if (hasActiveFilters(filters)) {
      const filtered = filterPostsClientSide(entries, filters);
      setFilteredEntries(filtered);
    } else {
      setFilteredEntries(entries);
    }
  }, [filters, entries]);

  const loadFeed = async (reset = false) => {
    try {
      setLoading(true);
      setError(null);
      const currentOffset = reset ? 0 : offset;
      
      const { data, error } = await supabase.rpc('feed_explore', {
        p_limit: 20,
        p_offset: currentOffset
      });

      if (error) {
        console.error('Error loading explore feed:', error);
        setError('Fehler beim Laden der Feed-Daten');
        return;
      }

      if (reset) {
        setEntries(data || []);
        setOffset(20);
      } else {
        setEntries(prev => [...prev, ...(data || [])]);
        setOffset(prev => prev + 20);
      }

      // Check if we got less than 20 items (end of feed)
      if (!data || data.length < 20) {
        setExhausted(true);
      }
    } catch (err) {
      console.error('Error loading explore feed:', err);
      setError('Fehler beim Laden der Feed-Daten');
    } finally {
      setLoading(false);
    }
  };

  const updateURL = (newFilters: FilterState) => {
    const params = createFilterParams(newFilters);
    const newURL = params.toString() ? `?${params.toString()}` : '/explore';
    router.replace(newURL, { scroll: false });
  };

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    updateURL(updatedFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters = clearFilters();
    setFilters(clearedFilters);
    updateURL(clearedFilters);
  };

  const loadMore = () => {
    if (!loading && !exhausted) {
      loadFeed(false);
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const entryTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - entryTime.getTime()) / 1000);

    if (diffInSeconds < 60) return 'gerade eben';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} Min`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} Std`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} Tag`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} Mon`;
    return `${Math.floor(diffInSeconds / 31536000)} Jahr`;
  };

  return (
    <main className="pb-12">
      <div className="space-y-6">
        {/* Header */}
        <div className="section">
          <div className="mb-4">
            <h1 className="h1">Entdecken</h1>
            <p className="opacity-70 text-sm mt-1">
              Entdecke die faszinierende Welt der Auto-Logbücher unserer Community
            </p>
          </div>

          {/* Filters */}
          <ExploreFilters
            filters={filters}
            onFiltersChange={handleFilterChange}
            onClearFilters={handleClearFilters}
          />
        </div>

        {/* Feed */}
        {loading && entries.length === 0 ? (
          <div className="section text-center py-16">
            <div className="text-xl">Lade Feed...</div>
          </div>
        ) : error ? (
          <div className="section text-center py-16">
            <div className="text-xl text-red-500 mb-4">{error}</div>
            <button
              onClick={() => loadFeed(true)}
              className="bg-[#6A3FFB] hover:bg-[#3F297A] text-white px-4 py-2 rounded-full"
            >
              Erneut versuchen
            </button>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="section text-center py-16">
            <div className="text-xl mb-4">
              {hasActiveFilters(filters) ? 'Keine Einträge mit diesen Filtern gefunden' : 'Keine Einträge gefunden'}
            </div>
            <p className="opacity-70">
              {hasActiveFilters(filters) 
                ? 'Versuchen Sie andere Filter oder erstellen Sie den ersten Eintrag.'
                : 'Erstellen Sie den ersten Eintrag.'
              }
            </p>
            {hasActiveFilters(filters) && (
              <button
                onClick={handleClearFilters}
                className="mt-4 bg-[#6A3FFB] hover:bg-[#3F297A] text-white px-4 py-2 rounded-full"
              >
                Filter zurücksetzen
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEntries.map((entry) => {
              const image = getLogbookImage(entry.media_preview);
              return (
                <article key={entry.id} className="section grid grid-cols-[80px_1fr] gap-3">
                  {/* мини-обложка слева */}
                  <div className="img-rounded w-[80px] h-[100px] relative overflow-hidden">
                    <StorageImg 
                      image={image}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  </div>
                  {/* контент */}
                  <div className="space-y-2">
                    <h3 className="text-lg md:text-xl font-extrabold leading-tight">{entry.title}</h3>
                    {image.src && (
                      <div className="img-rounded aspect-[16/9] relative overflow-hidden">
                        <StorageImg 
                          image={image}
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      </div>
                    )}
                    <p className="opacity-80 line-clamp-3">{entry.content}</p>
                    <div className="flex items-center justify-between">
                      <a href={`/logbuch/${entry.id}`} className="btn-primary">Weiterlesen →</a>
                      <div className="flex items-center gap-4 text-sm opacity-70">
                        <LikeButton
                          entryId={entry.id}
                          initialLiked={false} // Explore feed doesn't have liked_by_me
                          initialCount={entry.likes_count}
                          size="sm"
                          className="opacity-70 hover:opacity-100"
                        />
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span>{entry.comments_count} Kommentare</span>
                        </div>
                        <div className="bg-accent text-black px-2 py-1 rounded-full text-xs font-medium">
                          @{entry.author_handle}
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}

            {/* Load More */}
            {!exhausted && (
              <div className="text-center py-8">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="btn-primary flex items-center gap-2 mx-auto"
                >
                  {loading ? 'Lade...' : 'Mehr laden'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
