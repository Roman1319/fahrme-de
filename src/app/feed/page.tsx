"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/AuthProvider';
import CarOfTheDay from "@/components/CarOfTheDay";
import Guard from "@/components/auth/Guard";

// Daten für das gestrige Auto des Tages
const yesterdayCar = {
  id: "yesterday",
  make: "Nissan",
  model: "GT-R",
  year: 2019,
  image: "/nissan-gtr-2019-4k-zd-3840x2400.jpg",
  description: "Der legendäre GT-R mit seinem ikonischen Design und brutaler Performance. Ein Traum für jeden Autoliebhaber.",
  votes: 1247
};

// Daten für die Auswahl des heutigen Autos des Tages
const todayCars = [
  { id: "1", make: "BMW", model: "M3", image: "/bmw-g20.jpg" },
  { id: "2", make: "Audi", model: "A4", image: "/a4-b9.jpg" },
  { id: "3", make: "Mini", model: "Cooper S", image: "/mini-r56.jpg" },
  { id: "4", make: "BMW", model: "M3", image: "/bmw-g20.jpg" },
  { id: "5", make: "Audi", model: "A4", image: "/a4-b9.jpg" },
  { id: "6", make: "Mini", model: "Cooper S", image: "/mini-r56.jpg" },
  { id: "7", make: "BMW", model: "M3", image: "/bmw-g20.jpg" },
  { id: "8", make: "Audi", model: "A4", image: "/a4-b9.jpg" }
];

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
      
      const { data, error } = await supabase.rpc(
        user ? 'feed_personal' : 'feed_explore',
        {
          p_limit: 10,
          p_offset: currentOffset
        }
      );

      if (error) {
        console.error('Error loading feed:', error);
        return;
      }

      if (reset) {
        // Remove duplicates by ID
        const uniquePosts = (data || []).filter((post: FeedPost, index: number, self: FeedPost[]) => 
          index === self.findIndex((p: FeedPost) => p.id === post.id)
        );
        setPosts(uniquePosts);
        setOffset(10);
      } else {
        // Remove duplicates when appending
        const newPosts = (data || []).filter((newPost: FeedPost) => 
          !posts.some((existingPost: FeedPost) => existingPost.id === newPost.id)
        );
        setPosts(prev => [...prev, ...newPosts]);
        setOffset(prev => prev + 10);
      }

      // Check if we got less than 10 items (end of feed)
      if (!data || data.length < 10) {
        setExhausted(true);
      }
    } catch (error) {
      console.error('Error in loadFeed:', error);
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

  const getMediaUrl = (mediaPreview: string) => {
    if (!mediaPreview) return null;
    const { data } = supabase.storage
      .from('logbook')
      .getPublicUrl(mediaPreview);
    return data.publicUrl;
  };

  const handleVote = (carId: string) => {
    // Logik für die Abstimmung über das Auto des Tages
    console.log('Voting for car:', carId);
    // Hier kann ein API-Aufruf für die Abstimmung hinzugefügt werden
  };

  return (
    <Guard>
      <main className="pb-12">
        <section className="space-y-4">
          {/* Автомобиль дня - главный раздел */}
          <CarOfTheDay 
            yesterdayCar={yesterdayCar} 
            todayCars={todayCars} 
            onVote={handleVote} 
          />

          {/* Лента постов */}
          {loading && posts.length === 0 ? (
            <div className="section text-center py-16">
              <div className="text-xl">Lade Feed...</div>
            </div>
          ) : posts.length === 0 ? (
            <div className="section text-center py-16">
              <div className="text-xl mb-4">Keine Posts gefunden</div>
              <p className="opacity-70">Erstelle den ersten Logbuch-Eintrag!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post, index) => {
                const mediaUrl = getMediaUrl(post.media_preview);
                return (
                  <article key={`${post.id}-${index}`} className="section grid grid-cols-[80px_1fr] gap-3">
                    {/* мини-обложка слева */}
                    <div className="img-rounded w-[80px] h-[100px] relative overflow-hidden">
                      {mediaUrl ? (
                        <img src={mediaUrl} alt="" className="absolute inset-0 h-full w-full object-cover"/>
                      ) : (
                        <div className="absolute inset-0 bg-white/10 flex items-center justify-center">
                          <span className="text-white/50 text-xs">No Image</span>
                        </div>
                      )}
                    </div>
                    {/* контент */}
                    <div className="space-y-2">
                      <h3 className="text-lg md:text-xl font-extrabold leading-tight">{post.title}</h3>
                      {mediaUrl && (
                        <div className="img-rounded aspect-[16/9] relative overflow-hidden">
                          <img src={mediaUrl} alt={post.title} className="absolute inset-0 h-full w-full object-cover"/>
                        </div>
                      )}
                      <p className="opacity-80 line-clamp-3">{post.content}</p>
                      <div className="flex items-center justify-between">
                        <a href={`/logbuch/${post.id}`} className="btn-primary">Weiterlesen →</a>
                        <div className="flex items-center gap-4 text-sm opacity-70">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-accent rounded-full"></div>
                            <span>{post.likes_count} Likes</span>
                          </div>
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