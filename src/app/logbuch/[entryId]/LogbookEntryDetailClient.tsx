'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Heart, MessageCircle, Share2, Edit, Trash2 } from 'lucide-react';
import { LogbookEntry, Comment } from '@/lib/types';
import { useAuth } from '@/components/AuthProvider';
import { profileDisplayName } from '@/lib/format';
import CommentsList from '@/components/ui/CommentsList';
import ErrorBoundaryClient from '@/components/ErrorBoundaryClient';

type Props = {
  entry: LogbookEntry;
  comments: Comment[];
  entryId: string;
};

export default function LogbookEntryDetailClient({ entry, comments, entryId }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleToggleLike = () => {
    if (!entry || !user) return;
    
    // TODO: Implement like functionality
    console.log('Toggle like for entry:', entryId);
  };

  const handleAddComment = (text: string) => {
    if (!entry || !user) return;
    
    // TODO: Implement comment functionality
    console.log('Add comment:', text);
  };

  const handleEditComment = (commentId: string, newText: string) => {
    if (!entry) return;
    
    // TODO: Implement edit comment functionality
    console.log('Edit comment:', commentId, newText);
  };

  const handleDeleteComment = (commentId: string) => {
    if (!entry) return;
    
    // TODO: Implement delete comment functionality
    console.log('Delete comment:', commentId);
  };

  const handleLikeComment = (commentId: string) => {
    if (!entry || !user) return;
    
    // TODO: Implement comment like functionality
    console.log('Like comment:', commentId);
  };

  const handleEditEntry = () => {
    if (!entry) return;
    router.push(`/logbuch/${entryId}/edit`);
  };

  const handleDeleteEntry = () => {
    if (!entry || !user || entry.author_id !== user.id) return;
    
    // TODO: Implement delete entry functionality
    console.log('Delete entry:', entryId);
    router.push('/');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: entry?.title || 'Logbuch Eintrag',
        text: entry?.content || '',
        url: window.location.href
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const canEdit = user && entry && entry.author_id === user.id;
  const hasLiked = false; // TODO: Implement like status loading
  const likesCount = 0; // TODO: Implement likes count loading

  return (
    <ErrorBoundaryClient>
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
              
              <div className="flex items-center gap-2">
                <button
                  onClick={handleShare}
                  className="p-2 text-white/70 hover:text-white transition-colors"
                  title="Teilen"
                >
                  <Share2 className="w-5 h-5" />
                </button>
                
                {canEdit && (
                  <>
                    <button
                      onClick={handleEditEntry}
                      className="p-2 text-white/70 hover:text-white transition-colors"
                      title="Bearbeiten"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="p-2 text-red-400 hover:text-red-300 transition-colors"
                      title="Löschen"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Entry Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-4">{entry.title}</h1>
            
            <div className="flex items-center gap-4 text-sm text-white/60 mb-6">
              <span>{profileDisplayName(entry.author)}</span>
              <span>•</span>
              <span>
                {entry.publish_date 
                  ? new Date(entry.publish_date).toLocaleDateString('de-DE')
                  : 'Unbekannt'
                }
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleToggleLike}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  hasLiked 
                    ? 'bg-accent text-white' 
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
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
            </div>
          </div>

          {/* Entry Content */}
          <div className="prose prose-invert max-w-none mb-8">
            <div dangerouslySetInnerHTML={{ __html: entry.content }} />
          </div>

          {/* Comments */}
          {entry.allow_comments && (
            <div className="border-t border-white/10 pt-8">
              <h2 className="text-xl font-semibold text-white mb-6">Kommentare</h2>
              <CommentsList 
                comments={comments}
                onAddComment={handleAddComment}
                onEditComment={handleEditComment}
                onDeleteComment={handleDeleteComment}
                onLikeComment={handleLikeComment}
              />
            </div>
          )}
        </div>

        {/* Delete Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Eintrag löschen
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Sind Sie sicher, dass Sie diesen Eintrag löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors text-gray-800 dark:text-gray-200"
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
    </ErrorBoundaryClient>
  );
}
