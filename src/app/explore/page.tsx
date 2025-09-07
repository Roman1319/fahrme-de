"use client";

import { useState, useEffect } from 'react';
import { Heart, MessageCircle, Eye, Filter } from 'lucide-react';
import { FeedEntry, getExploreFeed, getCarBrands, getYearRange } from '@/lib/feed';
import { FeedFilters } from '@/lib/feed';

export default function ExplorePage() {
  const [entries, setEntries] = useState<FeedEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FeedFilters>({
    limit: 20,
    offset: 0
  });
  const [showFilters, setShowFilters] = useState(false);
  const [brands, setBrands] = useState<string[]>([]);
  // const [models, setModels] = useState<string[]>([]); // TODO: Use models if needed
  const [yearRange, setYearRange] = useState({ min: 1900, max: new Date().getFullYear() });

  useEffect(() => {
    loadFeed();
    loadFilters();
  }, [filters]);

  const loadFeed = async () => {
    try {
      setLoading(true);
      setError(null);
      const feedData = await getExploreFeed(filters);
      setEntries(feedData);
    } catch (err) {
      console.error('Error loading feed:', err);
      setError('Fehler beim Laden der Feed-Daten');
    } finally {
      setLoading(false);
    }
  };

  const loadFilters = async () => {
    try {
      const [brandsData, yearRangeData] = await Promise.all([
        getCarBrands(),
        getYearRange()
      ]);
      setBrands(brandsData);
      setYearRange(yearRangeData);
    } catch (err) {
      console.error('Error loading filters:', err);
    }
  };

  const handleFilterChange = (newFilters: Partial<FeedFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, offset: 0 }));
  };

  const loadMore = () => {
    setFilters(prev => ({ ...prev, offset: (prev.offset || 0) + (prev.limit || 20) }));
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
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="h1">Entdecken</h1>
              <p className="opacity-70 text-sm mt-1">
                Entdecke die faszinierende Welt der Auto-Logbücher unserer Community
              </p>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-secondary flex items-center gap-2"
            >
              <Filter size={16} />
              Filter
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="bg-white/5 rounded-lg p-4 space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="form-label">Marke</label>
                  <select
                    value={filters.car_brand || ''}
                    onChange={(e) => handleFilterChange({ car_brand: e.target.value || undefined })}
                    className="form-input"
                  >
                    <option value="">Alle Marken</option>
                    {brands.map(brand => (
                      <option key={brand} value={brand}>{brand}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Modell</label>
                  <select
                    value={filters.car_model || ''}
                    onChange={(e) => handleFilterChange({ car_model: e.target.value || undefined })}
                    className="form-input"
                    disabled={!filters.car_brand}
                  >
                    <option value="">Alle Modelle</option>
                    {models.map(model => (
                      <option key={model} value={model}>{model}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Baujahr von</label>
                  <select
                    value={filters.year_from || ''}
                    onChange={(e) => handleFilterChange({ year_from: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="form-input"
                  >
                    <option value="">Alle Jahre</option>
                    {Array.from({ length: yearRange.max - yearRange.min + 1 }, (_, i) => yearRange.max - i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
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
              onClick={loadFeed}
              className="bg-[#6A3FFB] hover:bg-[#3F297A] text-white px-4 py-2 rounded-full"
            >
              Erneut versuchen
            </button>
          </div>
        ) : entries.length === 0 ? (
          <div className="section text-center py-16">
            <div className="text-xl mb-4">Keine Einträge gefunden</div>
            <p className="opacity-70">Versuchen Sie andere Filter oder erstellen Sie den ersten Eintrag.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => (
              <div key={entry.id} className="section p-4 hover:bg-white/5 transition-colors">
                <div className="flex gap-4">
                  {/* Author Avatar */}
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                      {entry.author_avatar_url ? (
                        <img 
                          src={entry.author_avatar_url} 
                          alt={entry.author_handle} 
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-white/70 font-semibold">
                          {entry.author_handle.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-sm">@{entry.author_handle}</span>
                      <span className="text-xs opacity-70">•</span>
                      <span className="text-xs opacity-70">{entry.car_brand} {entry.car_model} ({entry.car_year})</span>
                      <span className="text-xs opacity-70">•</span>
                      <span className="text-xs opacity-70">{formatTimeAgo(entry.publish_date)}</span>
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-base mb-2">{entry.title}</h3>

                    {/* Content Preview */}
                    <p className="text-sm opacity-80 mb-3 line-clamp-3">{entry.content}</p>

                    {/* Actions */}
                    <div className="flex items-center gap-4">
                      <button className="flex items-center gap-1 text-sm opacity-70 hover:opacity-100 transition-opacity">
                        <Heart size={16} />
                        <span>{entry.like_count}</span>
                      </button>
                      <button className="flex items-center gap-1 text-sm opacity-70 hover:opacity-100 transition-opacity">
                        <MessageCircle size={16} />
                        <span>{entry.comment_count}</span>
                      </button>
                      <button className="flex items-center gap-1 text-sm opacity-70 hover:opacity-100 transition-opacity">
                        <Eye size={16} />
                        <span>Ansehen</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Load More */}
            {entries.length >= (filters.limit || 20) && (
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
