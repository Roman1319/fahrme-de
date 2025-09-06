'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Heart, MessageCircle, Share2, MoreVertical, Edit, Trash2 } from 'lucide-react';
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
  likeComment
} from '@/lib/interactions';
import { isCarOwner } from '@/lib/fix-car-ownership';
import { readProfileByEmail } from '@/lib/profile';
import CommentsList from '@/components/ui/CommentsList';

export default function LogbookEntryPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const carId = params.carId as string;
  const brand = params.brand as string;
  const model = params.model as string;
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
  }, [carId, entryId, user]);

  useEffect(() => {
    loadCommentProfiles();
  }, [comments]);

  const loadCar = () => {
    const savedCars = localStorage.getItem('fahrme:my-cars');
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
      if (!commentProfiles[comment.authorEmail]) {
        const profile = readProfileByEmail(comment.authorEmail);
        if (profile) {
          profiles[comment.authorEmail] = {
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
    
    toggleLogbookEntryLike(entry.id, user.email);
    loadEntry(); // Reload to update like count
  };

  const handleAddComment = (text: string, images?: string[]) => {
    if (!user || !entry) return;

    addComment(entryId, text, user.name, user.email, undefined, images || []);
    loadComments();
  };

  const handleAddReply = (parentId: string, text: string, images?: string[]) => {
    if (!user || !entry) return;

    addComment(entryId, text, user.name, user.email, parentId, images || []);
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
    
    likeComment(entryId, commentId, user.email);
    loadComments();
  };

  const handleLikeReply = (parentId: string, replyId: string) => {
    if (!user) return;
    
    likeComment(entryId, replyId, user.email);
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

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: entry?.title || 'Logbuch-Eintrag',
        text: entry?.text || '',
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

  const isOwner = user && isCarOwner(car, user.email);

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
            {isOwner && (
              <button
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                title="Bearbeiten"
              >
                <Edit size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Entry Content */}
        <div className="bg-white/5 rounded-lg p-6 border border-white/10 mb-6">
          {/* Author and Meta */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-accent text-black px-2 py-1 rounded-full text-sm font-medium">
                @{entry.author}
              </div>
              <span className="text-sm opacity-70">{entry.timestamp}</span>
              <span className="text-xs opacity-50 bg-white/10 px-2 py-1 rounded-full">
                {entry.type === 'maintenance' ? 'Wartung' :
                 entry.type === 'repair' ? 'Reparatur' :
                 entry.type === 'tuning' ? 'Tuning' :
                 entry.type === 'trip' ? 'Fahrt' :
                 entry.type === 'event' ? 'Event' :
                 'Allgemein'}
              </span>
            </div>
          </div>

          {/* Images */}
          {entry.images && entry.images.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {entry.images.map((image, index) => (
                <div key={index} className="aspect-video bg-white/5 rounded-lg overflow-hidden">
                  <img 
                    src={image} 
                    alt={`${entry.title} ${index + 1}`} 
                    className="w-full h-full object-cover" 
                  />
                </div>
              ))}
            </div>
          )}

          {/* Additional Info */}
          {(entry.mileage || entry.cost) && (
            <div className="flex flex-wrap gap-3 mb-6 text-sm">
              {entry.mileage && (
                <div className="bg-white/10 px-3 py-2 rounded-lg border border-white/20">
                  <span className="opacity-70">📏 Kilometerstand:</span>
                  <span className="ml-2 font-medium">
                    {entry.mileage.toLocaleString()} {entry.mileageUnit}
                  </span>
                </div>
              )}
              {entry.cost && (
                <div className="bg-white/10 px-3 py-2 rounded-lg border border-white/20">
                  <span className="opacity-70">💰 Kosten:</span>
                  <span className="ml-2 font-medium">
                    {entry.cost} {entry.currency}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Poll */}
          {entry.poll && (
            <div className="bg-white/10 rounded-lg p-4 mb-6 border border-white/20">
              <h3 className="font-medium mb-3">{entry.poll.question}</h3>
              <div className="space-y-2">
                {entry.poll.options.map((option, index) => (
                  <div key={index} className="text-sm opacity-80">
                    • {option}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Text Content */}
          <div className="prose prose-sm max-w-none dark:prose-invert mb-6">
            {entry.text.split('\n').map((line, index) => {
              // Simple markdown parsing
              if (line.startsWith('![') && line.includes('](') && line.includes(')')) {
                const match = line.match(/!\[([^\]]*)\]\(([^)]+)\)/);
                if (match) {
                  return (
                    <div key={index} className="my-4">
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
            })}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <div className="flex items-center gap-6">
              <button
                onClick={handleToggleLike}
                className={`flex items-center gap-2 transition-all hover:scale-105 ${
                  hasUserLikedLogbookEntry(entry.id, user?.email || '') 
                    ? 'opacity-100 text-accent' 
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                <Heart className={`w-5 h-5 ${hasUserLikedLogbookEntry(entry.id, user?.email || '') ? 'fill-current' : ''}`} />
                <span className="font-medium">{getLogbookEntryLikes(entry.id)}</span>
              </button>
              
              {entry.allowComments && (
                <div className="flex items-center gap-2 opacity-70">
                  <MessageCircle className="w-5 h-5" />
                  <span className="font-medium">{comments.length}</span>
                </div>
              )}
            </div>
            
            <div className="text-sm opacity-50">
              {entry.language} • {entry.publishDate}
            </div>
          </div>
        </div>

        {/* Comments Section */}
        {entry.allowComments && (
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
