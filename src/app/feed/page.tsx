"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/AuthProvider';
import CarOfTheDay from "@/components/CarOfTheDay";
import Guard from "@/components/auth/Guard";
import { getLogbookImage } from '@/lib/storage-helpers';
import { StorageImg } from '@/components/ui/StorageImage';
import LikeButton from '@/components/ui/LikeButton';
import { logger } from '@/lib/logger';


interface FeedPost {
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
  liked_by_me?: boolean; // Только для персональной ленты
  publish_date: string;
}

export default function FeedPage(){
  const { user } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [exhausted, setExhausted] = useState(false);

  const loadFeed = async (reset = false) => {
    try {
      setLoading(true);
      const currentOffset = reset ? 0 : offset;
      
      logger.debug('[Feed] Loading feed:', { 
        user: !!user, 
        userId: user?.id, 
        offset: currentOffset,
        reset 
      });

      // Попытка персонального источника
      let data = null;
      let error = null;

      if (user) {
        logger.debug('[Feed] Trying personal feed...');
        const personalResult = await supabase.rpc('feed_personal', {
          p_limit: 10,
          p_offset: currentOffset
        });
        
        if (personalResult.error) {
          logger.warn('[Feed] Personal feed failed:', {
            code: personalResult.error.code,
            message: personalResult.error.message,
            details: personalResult.error.details,
            hint: personalResult.error.hint
          });
          
          // Fallback на explore
          logger.debug('[Feed] Falling back to explore feed...');
          const exploreResult = await supabase.rpc('feed_explore', {
            p_limit: 10,
            p_offset: currentOffset
          });
          
          data = exploreResult.data;
          error = exploreResult.error;
        } else {
          data = personalResult.data;
          error = personalResult.error;
        }
      } else {
        logger.debug('[Feed] Loading explore feed...');
        const exploreResult = await supabase.rpc('feed_explore', {
          p_limit: 10,
          p_offset: currentOffset
        });
        
        data = exploreResult.data;
        error = exploreResult.error;
      }

      if (error) {
        logger.error('[Feed] Error loading feed:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          stack: error.stack
        });
        
        // Всегда показываем пустой массив вместо падения
        logger.debug('[Feed] Using fallback data due to error');
        data = [];
      }

      const postsData = data || [];
      
      if (reset) {
        // Remove duplicates by ID
        const uniquePosts = postsData.filter((post: FeedPost, index: number, self: FeedPost[]) => 
          index === self.findIndex((p: FeedPost) => p.id === post.id)
        );
        setPosts(uniquePosts);
        setOffset(10);
      } else {
        // Remove duplicates when appending
        const newPosts = postsData.filter((newPost: FeedPost) => 
          !posts.some((existingPost: FeedPost) => existingPost.id === newPost.id)
        );
        setPosts(prev => [...prev, ...newPosts]);
        setOffset(prev => prev + 10);
      }

      // Check if we got less than 10 items (end of feed)
      if (postsData.length < 10) {
        setExhausted(true);
      }
    } catch (error) {
      logger.error('[Feed] Error in loadFeed:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Всегда показываем пустой массив вместо падения
      logger.debug('[Feed] Using fallback due to catch error');
      const fallbackData: FeedPost[] = [];
      
      if (reset) {
        setPosts(fallbackData);
        setOffset(10);
      } else {
        setPosts(prev => [...prev, ...fallbackData]);
        setOffset(prev => prev + 10);
      }
      
      setExhausted(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeed(true);
  }, [user]);

  const loadMore = () => {
    if (!loading && !exhausted) {
      loadFeed(false);
    }
  };

  // Удаляем старую функцию getMediaUrl - теперь используем getLogbookImage

  return (
    <Guard>
      <main className="pb-12">
        <section className="space-y-4">
          {/* Автомобиль дня - главный раздел */}
          <CarOfTheDay />

          {/* Лента постов */}
          {loading && posts.length === 0 ? (
            <div className="section text-center py-16">
              <div className="text-xl">Lade Feed...</div>
            </div>
          ) : posts.length === 0 ? (
            <div className="section text-center py-16">
              <div className="text-xl mb-4">
                {user ? 'Keine Posts in deiner persönlichen Lente' : 'Keine Posts gefunden'}
              </div>
              <p className="opacity-70 mb-4">
                {user ? 'Folge Autos, um ihre Logbuch-Einträge in deiner persönlichen Lente zu sehen!' : 'Erstelle den ersten Logbuch-Eintrag!'}
              </p>
              {user && (
                <a href="/explore" className="btn-primary">
                  Autos entdecken →
                </a>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post, index) => {
                const image = getLogbookImage(post.media_preview);
                return (
                  <article key={`${post.id}-${index}`} className="section grid grid-cols-[80px_1fr] gap-3">
                    {/* мини-обложка слева */}
                    <div className="img-rounded w-[80px] h-[100px] relative overflow-hidden">
                      <StorageImg 
                        image={image}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    </div>
                    {/* контент */}
                    <div className="space-y-2">
                      <h3 className="text-lg md:text-xl font-extrabold leading-tight">{post.title}</h3>
                      {image.src && (
                        <div className="img-rounded aspect-[16/9] relative overflow-hidden">
                          <StorageImg 
                            image={image}
                            className="absolute inset-0 h-full w-full object-cover"
                          />
                        </div>
                      )}
                      <p className="opacity-80 line-clamp-3">{post.content}</p>
                      <div className="flex items-center justify-between">
                        <a href={`/logbuch/${post.id}`} className="btn-primary">Weiterlesen →</a>
                        <div className="flex items-center gap-4 text-sm opacity-70">
                          <LikeButton
                            entryId={post.id}
                            initialLiked={post.liked_by_me || false}
                            initialCount={post.likes_count}
                            size="sm"
                            className="opacity-70 hover:opacity-100"
                          />
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                            <span>{post.comments_count} Kommentare</span>
                          </div>
                          <div className="bg-accent text-black px-2 py-1 rounded-full text-xs font-medium">
                            @{post.author_handle}
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}

              {/* Load More Button */}
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
        </section>
      </main>
    </Guard>
  );
}