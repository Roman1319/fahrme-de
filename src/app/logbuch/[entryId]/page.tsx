'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Heart, MessageCircle, Share2, Edit, Trash2 } from 'lucide-react';
import { LogbookEntry, Comment } from '@/lib/types';
import { useAuth } from '@/components/AuthProvider';
import { 
  getLogbookEntryById, 
  hasUserLikedLogbookEntry, 
  getLogbookEntryLikes,
  getComments,
  addComment,
  editComment,
  deleteComment,
  likeComment,
  deleteLogbookEntry,
  isEntryOwner
} from '@/lib/logbook-detail';
import CommentsList from '@/components/ui/CommentsList';

export default function LogbookEntryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const entryId = params.entryId as string;
  
  const [entry, setEntry] = useState<LogbookEntry | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    loadEntry();
    loadComments();
  }, [entryId]);

  const loadEntry = () => {
    const foundEntry = getLogbookEntryById(entryId);
    if (foundEntry) {
      setEntry(foundEntry);
    }
    setIsLoading(false);
  };

  const loadComments = () => {
    const entryComments = getComments(entryId);
    setComments(entryComments);
  };

  const handleToggleLike = () => {
    if (!entry || !user) return;
    
    // const newLiked = toggleLogbookEntryLike(entryId, user.id); // TODO: Use newLiked if needed
    // Optimistic update
    setEntry(prev => prev ? { ...prev } : null);
  };

  const handleAddComment = (text: string) => {
    if (!entry || !user) return;
    
    addComment(entryId, {
      text,
      author_id: user.id,
      entry_id: entryId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      parent_id: undefined
    });
    
    loadComments();
  };

  const handleEditComment = (commentId: string, newText: string) => {
    if (!entry) return;
    
    editComment(entryId, commentId, newText);
    loadComments();
  };

  const handleDeleteComment = (commentId: string) => {
    if (!entry) return;
    
    deleteComment(entryId, commentId);
    loadComments();
  };

  const handleLikeComment = (commentId: string) => {
    if (!entry || !user) return;
    
    likeComment(entryId, commentId, user.id);
    loadComments();
  };

  const handleEditEntry = () => {
    if (!entry) return;
    router.push(`/logbuch/${entryId}/edit`);
  };

  const handleDeleteEntry = () => {
    if (!entry || !user || !isEntryOwner(entry, user.id)) return;
    
    deleteLogbookEntry(entryId);
    router.push('/');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: entry?.title || 'Logbuch Eintrag',
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      console.info('Link copied to clipboard');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Eintrag nicht gefunden</h1>
          <button 
            onClick={() => router.push('/')}
            className="btn-accent"
          >
            Zurück zur Startseite
          </button>
        </div>
      </div>
    );
  }

  const canEdit = user && isEntryOwner(entry, user.id);
  const hasLiked = user ? hasUserLikedLogbookEntry(entryId, user.id) : false;
  const likesCount = getLogbookEntryLikes(entryId);

  return (
    <main className="min-h-screen bg-dark">
      {/* Header */}
      <div className="bg-white/5 border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Zurück
            </button>
            
            {canEdit && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleEditEntry}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white"
                >
                  <Edit className="w-4 h-4" />
                  Bearbeiten
                </button>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                  Löschen
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Entry Content */}
        <div className="bg-white/5 rounded-xl p-6 mb-6">
          {/* Title */}
          <h1 className="text-2xl font-bold text-white mb-4">
            {entry.title || 'Ohne Titel'}
          </h1>

          {/* Metadata */}
          <div className="flex items-center gap-4 text-sm text-white/60 mb-6">
            <span>{(entry as any).type || 'Allgemein'}</span>
            <span>•</span>
            <span>{(entry as any).author || 'Unbekannt'}</span>
            <span>•</span>
            <span>
              {entry.publish_date 
                ? new Date(entry.publish_date).toLocaleDateString('de-DE')
                : 'Unbekannt'
              }
            </span>
          </div>

          {/* Content */}
          <div className="prose prose-invert max-w-none mb-6">
            <div className="text-white whitespace-pre-wrap">
              {(entry as any).text || entry.content}
            </div>
          </div>

          {/* Photos */}
          {(entry as any).images && (entry as any).images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {(entry as any).images.map((image: any, index: any) => (
                <div key={index} className="aspect-square rounded-lg overflow-hidden">
                  <img 
                    src={image} 
                    alt={`Foto ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}

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
                disabled={!user}
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
              
              <button
                onClick={handleShare}
                className="flex items-center gap-2 opacity-70 hover:opacity-100 transition-opacity"
              >
                <Share2 className="w-5 h-5" />
                <span className="font-medium">Teilen</span>
              </button>
            </div>
            
            <div className="text-sm opacity-50">
              {(entry as any).language} • {entry.publish_date ? new Date(entry.publish_date).toLocaleDateString('de-DE') : 'Unbekannt'}
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
            onAddReply={() => {}} // Not implemented for now
            onLikeReply={() => {}} // Not implemented for now
            onEditReply={() => {}} // Not implemented for now
            onDeleteReply={() => {}} // Not implemented for now
            title="Kommentare"
          />
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">
              Eintrag löschen?
            </h3>
            <p className="text-white/70 mb-6">
              Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white"
              >
                Abbrechen
              </button>
              <button
                onClick={handleDeleteEntry}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors text-white"
              >
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
