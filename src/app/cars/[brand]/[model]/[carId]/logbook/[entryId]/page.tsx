'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Heart, MessageCircle, Share2, Edit, Trash2 } from 'lucide-react';
import { MyCar, LogbookEntry, Comment } from '@/lib/types';
import { useAuth } from '@/components/AuthProvider';
import { 
  getLogbookEntries
} from '@/lib/logbook';
import {
  toggleLogbookEntryLike, 
  getLogbookEntryLikes, 
  hasUserLikedLogbookEntry,
  getLogbookEntry,
  deleteLogbookEntry
} from '@/lib/logbook-operations';
import {
  addComment,
  getComments,
  editComment,
  deleteComment,
  likeComment
} from '@/lib/comments';
import CommentsList from '@/components/ui/CommentsList';

export default function LogbookEntryPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const carId = params.carId as string;
  // const brand = params.brand as string; // TODO: Use brand if needed
  // const model = params.model as string; // TODO: Use model if needed
  const entryId = params.entryId as string;
  
  const [car, setCar] = useState<MyCar | null>(null);
  const [entry, setEntry] = useState<LogbookEntry | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [commentProfiles, setCommentProfiles] = useState<Record<string, { avatarUrl?: string | null; displayName?: string }>>({});
  const [likesCount, setLikesCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        loadCar(),
        loadEntry(),
        loadComments()
      ]);
    };
    loadData();
  }, [carId, entryId, user]);

  useEffect(() => {
    if (entry && user) {
      loadLikes();
    }
  }, [entry, user]);

  useEffect(() => {
    loadCommentProfiles();
  }, [comments]); // TODO: Add loadCommentProfiles to deps when stable

  const loadCar = async () => {
    try {
      const { getCar } = await import('@/lib/cars');
      const carData = await getCar(carId);
      if (carData) {
        // Convert Car to MyCar format
        const myCar: MyCar = {
          id: carData.id,
          name: carData.name || '',
          make: carData.brand,
          model: carData.model,
          year: carData.year,
          color: carData.color || '',
          power: carData.power || 0,
          engine: carData.engine || '',
          volume: carData.volume || '',
          gearbox: carData.gearbox || '',
          drive: carData.drive || '',
          description: carData.description || '',
          story: carData.story || '',
          images: [], // Will be loaded separately
          isMainVehicle: carData.is_main_vehicle || false,
          isFormerCar: carData.is_former || false,
          addedDate: carData.created_at,
          ownerId: carData.owner_id
        };
        setCar(myCar);
      } else {
        setCar(null);
      }
    } catch (error) {
      console.error('Error loading car:', error);
      setCar(null);
    }
  };

  const loadEntry = async () => {
    try {
      const entryData = await getLogbookEntry(entryId);
      if (entryData) {
        // Convert to LogbookEntry format
        const logbookEntry: LogbookEntry = {
          id: entryData.id,
          car_id: entryData.car_id,
          author_id: entryData.author_id,
          title: entryData.title,
          content: entryData.content,
          allow_comments: entryData.allow_comments,
          publish_date: entryData.publish_date,
          created_at: entryData.created_at,
          updated_at: entryData.updated_at,
          author: entryData.author ? {
            name: entryData.author.name,
            handle: entryData.author.handle,
            avatar_url: entryData.author.avatar_url
          } : undefined,
          // Legacy fields for backward compatibility
          carId: entryData.car_id,
          authorId: entryData.author_id,
          publishDate: entryData.publish_date,
          createdAt: entryData.created_at,
          updatedAt: entryData.updated_at
        };
        setEntry(logbookEntry);
      } else {
        setEntry(null);
      }
    } catch (error) {
      console.error('Error loading entry:', error);
      setEntry(null);
    } finally {
      setIsLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      const commentsData = await getComments(entryId);
      setComments(commentsData);
    } catch (error) {
      console.error('Error loading comments:', error);
      setComments([]);
    }
  };

  const loadLikes = async () => {
    if (!entry || !user) return;
    
    try {
      const [count, liked] = await Promise.all([
        getLogbookEntryLikes(entry.id),
        hasUserLikedLogbookEntry(entry.id, user.id)
      ]);
      setLikesCount(count);
      setHasLiked(liked);
    } catch (error) {
      console.error('Error loading likes:', error);
    }
  };

  const loadCommentProfiles = () => {
    const profiles: Record<string, { avatarUrl?: string | null; displayName?: string }> = {};
    
    comments.forEach(comment => {
      if (comment.author && !commentProfiles[comment.author_id]) {
        profiles[comment.author_id] = {
          avatarUrl: comment.author.avatar_url,
          displayName: comment.author.name || comment.author.handle || 'Unknown User'
        };
      }
    });
    
    if (Object.keys(profiles).length > 0) {
      setCommentProfiles(prev => ({ ...prev, ...profiles }));
    }
  };

  const handleToggleLike = async () => {
    if (!user || !entry) return;
    
    await toggleLogbookEntryLike(entry.id, user.id);
    loadLikes(); // Reload likes
  };

  const handleAddComment = async (text: string, _images?: string[]) => { // TODO: Implement image handling
    if (!user || !entry) return;

    await addComment(entryId, text, user.id);
    loadComments();
  };

  const handleAddReply = async (parentId: string, text: string, _images?: string[]) => { // TODO: Implement image handling
    if (!user || !entry) return;

    await addComment(entryId, text, user.id, parentId);
    loadComments();
  };

  const handleEditComment = async (commentId: string, text: string) => {
    await editComment(commentId, text);
    loadComments();
  };

  const handleDeleteComment = async (commentId: string) => {
    await deleteComment(commentId);
    loadComments();
  };

  const handleLikeComment = async (commentId: string) => {
    if (!user) return;
    
    await likeComment(commentId, user.id);
    loadComments();
  };

  const handleLikeReply = async (parentId: string, replyId: string) => {
    if (!user) return;
    
    await likeComment(replyId, user.id);
    loadComments();
  };

  const handleEditReply = async (parentId: string, replyId: string, text: string) => {
    await editComment(replyId, text);
    loadComments();
  };

  const handleDeleteReply = async (parentId: string, replyId: string) => {
    await deleteComment(replyId);
    loadComments();
  };

  const handleEditEntry = () => {
    if (!entry) return;
    // Redirect to edit page (for now, we'll use the new page with pre-filled data)
    router.push(`/logbuch/${entryId}/edit`);
  };

  const handleDeleteEntry = async () => {
    if (!entry || !user || entry.author_id !== user.id) return;
    
    if (confirm('Möchten Sie diesen Logbuch-Eintrag wirklich löschen?')) {
      const success = await deleteLogbookEntry(entryId);
      if (success) {
        // Show success message
        alert('Eintrag wurde gelöscht');
        // Redirect to car page
        router.push(`/car/${carId}#logbook`);
      } else {
        alert('Fehler beim Löschen des Eintrags');
      }
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: entry?.title || 'Logbuch-Eintrag',
        text: entry?.content || '',
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link in die Zwischenablage kopiert!');
    }
  };

  if (isLoading) {
    return (
      <main className="pb-12">
        <div className="section text-center py-16">
          <div className="text-xl">Lade...</div>
        </div>
      </main>
    );
  }

  if (!car || !entry) {
    return (
      <main className="pb-12">
        <div className="section text-center py-16">
          <div className="text-xl">Eintrag nicht gefunden</div>
        </div>
      </main>
    );
  }

  // const isOwner = user && car && isCarOwnerByCar(car, user.id, user.email); // TODO: Use isOwner if needed
  const isEntryAuthor = user && entry && entry.author_id === user.id;

  return (
    <main className="pb-12">
      <section className="space-y-4">
        <div className="section">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="h1">{entry.title}</h1>
            <p className="opacity-70 text-sm">
              {car.make} {car.model} • {car.year}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleShare}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Teilen"
            >
              <Share2 size={20} />
            </button>
            {isEntryAuthor && (
              <div className="flex gap-2">
                <button
                  onClick={handleEditEntry}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  title="Bearbeiten"
                >
                  <Edit size={20} />
                </button>
                <button
                  onClick={handleDeleteEntry}
                  className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-400"
                  title="Löschen"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Entry Content */}
        <div className="bg-white/5 rounded-lg p-6 border border-white/10 mb-6">
          {/* Author and Meta */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-accent text-black px-2 py-1 rounded-full text-sm font-medium">
                @{/* TODO: Replace with proper author name lookup */}
                {(entry as unknown as { author?: string }).author || 'Unknown'}
              </div>
              <span className="text-sm opacity-70">
                {/* TODO: Replace with proper timestamp formatting */}
                {(entry as unknown as { timestamp?: string }).timestamp || entry.publish_date}
              </span>
              <span className="text-xs opacity-50 bg-white/10 px-2 py-1 rounded-full">
                {/* TODO: Replace with proper topic mapping */}
                {(() => {
                  const legacyEntry = entry as unknown as { 
                    topic?: string; 
                    type?: string; 
                  };
                  if (legacyEntry.topic === 'maintenance') return 'Wartung';
                  if (legacyEntry.topic === 'repair') return 'Reparatur';
                  if (legacyEntry.topic === 'tuning') return 'Tuning';
                  if (legacyEntry.topic === 'trip') return 'Fahrt';
                  if (legacyEntry.topic === 'event') return 'Event';
                  if (legacyEntry.topic === 'general') return 'Allgemein';
                  if (legacyEntry.type === 'maintenance') return 'Wartung';
                  if (legacyEntry.type === 'event') return 'Event';
                  if (legacyEntry.type === 'general') return 'Allgemein';
                  return 'Allgemein';
                })()}
              </span>
              {/* TODO: Replace with proper pinOnCar field */}
              {(entry as unknown as { pinOnCar?: boolean }).pinOnCar && (
                <span className="text-xs bg-accent text-black px-2 py-1 rounded-full font-medium">
                  Angepinnt
                </span>
              )}
            </div>
          </div>

          {/* Images */}
          {/* TODO: Replace with proper media handling when LogbookMedia is implemented */}
          {(() => {
            const legacyEntry = entry as unknown as { images?: string[] };
            return legacyEntry.images && legacyEntry.images.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {legacyEntry.images.map((image: string, index: number) => (
                  <div key={index} className="aspect-video bg-white/5 rounded-lg overflow-hidden">
                    {/* TODO: Replace with Next.js Image component for optimization */}
                    <img 
                      src={image} 
                      alt={`${entry.title} ${index + 1}`} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Additional Info */}
          {/* TODO: Replace with proper mileage and cost fields when implemented */}
          {(() => {
            const legacyEntry = entry as unknown as { 
              mileage?: number; 
              cost?: number; 
              mileageUnit?: string; 
              currency?: string; 
            };
            return (legacyEntry.mileage || legacyEntry.cost) && (
              <div className="flex flex-wrap gap-3 mb-6 text-sm">
                {legacyEntry.mileage && (
                  <div className="bg-white/10 px-3 py-2 rounded-lg border border-white/20">
                    <span className="opacity-70">📏 Kilometerstand:</span>
                    <span className="ml-2 font-medium">
                      {legacyEntry.mileage.toLocaleString()} {legacyEntry.mileageUnit || 'km'}
                    </span>
                  </div>
                )}
                {legacyEntry.cost && (
                  <div className="bg-white/10 px-3 py-2 rounded-lg border border-white/20">
                    <span className="opacity-70">💰 Kosten:</span>
                    <span className="ml-2 font-medium">
                      {legacyEntry.cost} {legacyEntry.currency || 'EUR'}
                    </span>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Poll */}
          {/* TODO: Replace with proper poll handling when implemented */}
          {(() => {
            const legacyEntry = entry as unknown as { 
              poll?: { 
                question: string; 
                options: string[]; 
              }; 
            };
            return legacyEntry.poll && (
              <div className="bg-white/10 rounded-lg p-4 mb-6 border border-white/20">
                <h3 className="font-medium mb-3">{legacyEntry.poll.question}</h3>
                <div className="space-y-2">
                  {legacyEntry.poll.options.map((option: string, index: number) => (
                    <div key={index} className="text-sm opacity-80">
                      • {option}
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Text Content */}
          <div className="prose prose-sm max-w-none dark:prose-invert mb-6">
            {(() => {
              const legacyEntry = entry as unknown as { text?: string };
              const content = legacyEntry.text || entry.content || '';
              return content.split('\n').map((line: string, index: number) => {
              // Simple markdown parsing
              if (line.startsWith('![') && line.includes('](') && line.includes(')')) {
                const match = line.match(/!\[([^\]]*)\]\(([^)]+)\)/);
                if (match) {
                  return (
                    <div key={index} className="my-4">
                      {/* TODO: Replace with Next.js Image component for optimization */}
                      <img 
                        src={match[2]} 
                        alt={match[1]} 
                        className="max-w-full h-auto rounded-lg" 
                      />
                    </div>
                  );
                }
              }
              if (line.startsWith('**') && line.endsWith('**')) {
                return (
                  <p key={index} className="font-bold text-lg">
                    {line.slice(2, -2)}
                  </p>
                );
              }
              if (line.startsWith('*') && line.endsWith('*') && !line.startsWith('**')) {
                return (
                  <p key={index} className="italic">
                    {line.slice(1, -1)}
                  </p>
                );
              }
              if (line.includes('[') && line.includes('](') && line.includes(')')) {
                const match = line.match(/\[([^\]]+)\]\(([^)]+)\)/);
                if (match) {
                  return (
                    <p key={index}>
                      <a href={match[2]} className="text-accent hover:underline">
                        {match[1]}
                      </a>
                    </p>
                  );
                }
              }
              return <p key={index} className="leading-relaxed">{line}</p>;
              });
            })()}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <div className="flex items-center gap-6">
              <button
                onClick={handleToggleLike}
                className={`flex items-center gap-2 transition-all hover:scale-105 ${
                  hasLiked 
                    ? 'opacity-100 text-accent' 
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                <Heart className={`w-5 h-5 ${hasLiked ? 'fill-current' : ''}`} />
                <span className="font-medium">{likesCount}</span>
              </button>
              
              {entry.allow_comments && (
                <div className="flex items-center gap-2 opacity-70">
                  <MessageCircle className="w-5 h-5" />
                  <span className="font-medium">{comments.length}</span>
                </div>
              )}
            </div>
            
            <div className="text-sm opacity-50">
              {/* TODO: Replace with proper language field when implemented */}
              {(entry as unknown as { language?: string }).language || 'Deutsch'} • {entry.publish_date ? new Date(entry.publish_date).toLocaleDateString('de-DE') : 'Unbekannt'}
            </div>
          </div>
        </div>

        {/* Comments Section */}
        {entry.allow_comments && (
          <CommentsList
            comments={comments}
            onAddComment={handleAddComment}
            onLikeComment={handleLikeComment}
            onEditComment={handleEditComment}
            onDeleteComment={handleDeleteComment}
            onAddReply={handleAddReply}
            onLikeReply={handleLikeReply}
            onEditReply={handleEditReply}
            onDeleteReply={handleDeleteReply}
            title="Kommentare"
          />
        )}
        </div>
      </section>
    </main>
  );
}
