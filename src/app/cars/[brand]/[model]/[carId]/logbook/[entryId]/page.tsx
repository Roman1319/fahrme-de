'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Heart, MessageCircle, Share2, Edit, Trash2 } from 'lucide-react';
import { MyCar, LogbookEntry, Comment } from '@/lib/types';
import { useAuth } from '@/components/AuthProvider';
import { 
  getLogbookEntries, 
  toggleLogbookEntryLike, 
  getLogbookEntryLikes, 
  hasUserLikedLogbookEntry,
  addComment,
  getComments,
  editComment,
  deleteComment,
  likeComment,
  deleteLogbookEntry
} from '@/lib/interactions';
// import { isCarOwnerByCar } from '@/lib/ownership'; // TODO: Use isCarOwnerByCar if needed
import { readProfileByEmail } from '@/lib/profile';
import CommentsList from '@/components/ui/CommentsList';
import { STORAGE_KEYS } from '@/lib/keys';

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

  useEffect(() => {
    loadCar();
    loadEntry();
    loadComments();
  }, [carId, entryId, user]); // TODO: Add loadCar, loadComments, loadEntry to deps when stable

  useEffect(() => {
    loadCommentProfiles();
  }, [comments]); // TODO: Add loadCommentProfiles to deps when stable

  const loadCar = () => {
    const savedCars = localStorage.getItem(STORAGE_KEYS.MY_CARS_KEY);
    if (savedCars) {
      try {
        const cars: MyCar[] = JSON.parse(savedCars);
        const foundCar = cars.find(c => c.id === carId);
        setCar(foundCar || null);
      } catch (error) {
        console.error('Error loading car:', error);
        setCar(null);
      }
    }
  };

  const loadEntry = () => {
    const entries = getLogbookEntries(carId);
    const foundEntry = entries.find(e => e.id === entryId);
    setEntry(foundEntry || null);
    setIsLoading(false);
  };

  const loadComments = () => {
    setComments(getComments(entryId));
  };

  const loadCommentProfiles = () => {
    const profiles: Record<string, { avatarUrl?: string | null; displayName?: string }> = {};
    
    comments.forEach(comment => {
      // TODO: Replace with proper author_id lookup when profile system is updated
      const authorEmail = (comment as unknown as { authorEmail?: string }).authorEmail;
      if (authorEmail && !commentProfiles[authorEmail]) {
        const profile = readProfileByEmail(authorEmail);
        if (profile) {
          profiles[authorEmail] = {
            avatarUrl: profile.avatarUrl,
            displayName: profile.displayName
          };
        }
      }
    });
    
    if (Object.keys(profiles).length > 0) {
      setCommentProfiles(prev => ({ ...prev, ...profiles }));
    }
  };

  const handleToggleLike = () => {
    if (!user || !entry) return;
    
    toggleLogbookEntryLike(entry.id, user.id, user.email);
    loadEntry(); // Reload to update like count
  };

  const handleAddComment = (text: string, _images?: string[]) => { // TODO: Implement image handling
    if (!user || !entry) return;

    addComment(entryId, text, user.name, user.email);
    loadComments();
  };

  const handleAddReply = (parentId: string, text: string, _images?: string[]) => { // TODO: Implement image handling
    if (!user || !entry) return;

    addComment(entryId, text, user.name, user.email, parentId);
    loadComments();
  };

  const handleEditComment = (commentId: string, text: string) => {
    editComment(entryId, commentId, text);
    loadComments();
  };

  const handleDeleteComment = (commentId: string) => {
    deleteComment(entryId, commentId);
    loadComments();
  };

  const handleLikeComment = (commentId: string) => {
    if (!user) return;
    
    likeComment(entryId, commentId);
    loadComments();
  };

  const handleLikeReply = (parentId: string, replyId: string) => {
    if (!user) return;
    
    likeComment(entryId, replyId);
    loadComments();
  };

  const handleEditReply = (parentId: string, replyId: string, text: string) => {
    editComment(entryId, replyId, text);
    loadComments();
  };

  const handleDeleteReply = (parentId: string, replyId: string) => {
    deleteComment(entryId, replyId);
    loadComments();
  };

  const handleEditEntry = () => {
    if (!entry) return;
    // Redirect to edit page (for now, we'll use the new page with pre-filled data)
    router.push(`/logbuch/${entryId}/edit`);
  };

  const handleDeleteEntry = () => {
    if (!entry || !user || entry.author_id !== user.id) return;
    
    if (confirm('Möchten Sie diesen Logbuch-Eintrag wirklich löschen?')) {
      const success = deleteLogbookEntry(carId, entryId);
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
                  hasUserLikedLogbookEntry(entry.id, user?.id || '') 
                    ? 'opacity-100 text-accent' 
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                <Heart className={`w-5 h-5 ${hasUserLikedLogbookEntry(entry.id, user?.id || '') ? 'fill-current' : ''}`} />
                <span className="font-medium">{getLogbookEntryLikes(entry.id)}</span>
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
