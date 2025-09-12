'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { MyCar, LogbookEntry, Comment } from '@/lib/types';
import { profileDisplayName } from '@/lib/format';
import { ArrowLeft, Heart, MessageCircle, Share2, Edit, Trash2 } from 'lucide-react';
import ErrorBoundaryClient from '@/components/ErrorBoundaryClient';
import { createSafeHtml } from '@/lib/sanitize';

// Client-side API functions
async function fetchCar(carId: string): Promise<MyCar | null> {
  try {
    const response = await fetch(`/api/cars/${carId}`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Error fetching car:', error);
    return null;
  }
}

async function fetchLogbookEntry(entryId: string): Promise<LogbookEntry | null> {
  try {
    const response = await fetch(`/api/logbook/${entryId}`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Error fetching entry:', error);
    return null;
  }
}

async function fetchComments(entryId: string): Promise<Comment[]> {
  try {
    const response = await fetch(`/api/logbook/${entryId}/comments`);
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error('Error fetching comments:', error);
    return [];
  }
}

async function fetchProfile(userId: string): Promise<{ name?: string; avatar_url?: string } | null> {
  try {
    const response = await fetch(`/api/profiles/${userId}`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
}

async function deleteEntry(entryId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/logbook/${entryId}`, {
      method: 'DELETE',
    });
    return response.ok;
  } catch (error) {
    console.error('Error deleting entry:', error);
    return false;
  }
}

async function addComment(entryId: string, text: string, authorId: string): Promise<Comment | null> {
  try {
    const response = await fetch(`/api/logbook/${entryId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, authorId }),
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Error adding comment:', error);
    return null;
  }
}

async function deleteComment(commentId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/comments/${commentId}`, {
      method: 'DELETE',
    });
    return response.ok;
  } catch (error) {
    console.error('Error deleting comment:', error);
    return false;
  }
}

type Props = {
  entryId: string;
  initialEntry: LogbookEntry;
  initialComments: Comment[];
};

export default function EntryPageClient({ entryId, initialEntry, initialComments }: Props) {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const carId = params.carId as string;
  
  const [entry, setEntry] = useState<LogbookEntry | null>(initialEntry ?? null);
  const [comments, setComments] = useState<Comment[]>(initialComments ?? []);
  const [car, setCar] = useState<MyCar | null>(null);
  const [commentProfiles, setCommentProfiles] = useState<Record<string, { name?: string; avatar_url?: string }>>({});
  const [loading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [showCommentForm, setShowCommentForm] = useState(false);

  // Load car data
  useEffect(() => {
    if (carId) {
      fetchCar(carId)
        .then(carData => {
          if (carData) {
            setCar(carData);
          }
        })
        .catch(error => {
          console.error('Error loading car:', error);
        });
    }
  }, [carId]);

  // Load logbook entry data
  useEffect(() => {
    if (entryId) {
      fetchLogbookEntry(entryId)
        .then(entryData => {
          if (entryData) {
            setEntry({ ...entryData, author: entryData.author ?? null });
          }
        })
        .catch(error => {
          console.error('Error loading entry:', error);
          setError('Eintrag nicht gefunden');
        });
    }
  }, [entryId]);

  // Load comments
  useEffect(() => {
    if (entryId) {
      fetchComments(entryId)
        .then(commentsData => {
          setComments(Array.isArray(commentsData) ? commentsData.map(c => ({ ...c, author: c.author ?? null })) : []);
        })
        .catch(error => {
          console.error('Error loading comments:', error);
          setComments([]);
        });
    }
  }, [entryId]);

  // Load comment profiles
  useEffect(() => {
    if (comments.length > 0) {
        const profiles: Record<string, { name?: string; avatar_url?: string }> = {};
      const loadProfiles = async () => {
        for (const comment of comments) {
          if (!commentProfiles[comment.author_id]) {
            try {
              const profile = await fetchProfile(comment.author_id);
              if (profile) {
                profiles[comment.author_id] = profile;
              }
            } catch (error) {
              console.error('Error loading profile:', error);
            }
          }
        }
        setCommentProfiles(prev => ({ ...prev, ...profiles }));
      };
      loadProfiles();
    }
  }, [comments, commentProfiles]);

  const handleDeleteEntry = () => {
    if (!entry || !user || entry.author_id !== user.id) return;
    
    if (confirm('Sind Sie sicher, dass Sie diesen Eintrag löschen möchten?')) {
      deleteEntry(entryId)
        .then(() => {
          router.push(`/cars/${params.brand}/${params.model}/${carId}/logbook`);
        })
        .catch(error => {
          console.error('Error deleting entry:', error);
        });
    }
  };

  const handleAddComment = () => {
    if (!user || !entry || !newComment.trim()) return;

    addComment(entryId, newComment.trim(), user.id)
      .then(comment => {
        if (comment) {
          setComments(prev => [...prev, comment]);
        }
        setNewComment('');
        setShowCommentForm(false);
      })
      .catch(error => {
        console.error('Error adding comment:', error);
      });
  };

  const handleDeleteComment = (commentId: string) => {
    if (!user) return;

    deleteComment(commentId)
      .then(() => {
        setComments(prev => prev.filter(c => c.id !== commentId));
      })
      .catch(error => {
        console.error('Error deleting comment:', error);
      });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Fehler</h1>
          <p className="text-white/70 mb-4">{error}</p>
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

  return (
    <ErrorBoundaryClient>
      <div className="min-h-screen bg-dark">
        {/* Header */}
        <div className="border-b border-white/10">
          <div className="container py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push(`/cars/${params.brand}/${params.model}/${carId}/logbook`)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} className="text-white" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-white">{entry.title}</h1>
                {car && (
                  <p className="text-white/60 text-sm">
                    {car.make} {car.model} {car.year}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container py-8">
          <div className="max-w-4xl mx-auto">
            {/* Entry Content */}
            <article className="bg-white/5 rounded-lg p-6 mb-8">
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

              <div className="prose prose-invert max-w-none">
                <div dangerouslySetInnerHTML={createSafeHtml(entry.content)} />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-4 mt-6 pt-6 border-t border-white/10">
                <button className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
                  <Heart size={16} />
                  <span>Gefällt mir</span>
                </button>
                <button 
                  onClick={() => setShowCommentForm(!showCommentForm)}
                  className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
                >
                  <MessageCircle size={16} />
                  <span>Kommentieren</span>
                </button>
                <button className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
                  <Share2 size={16} />
                  <span>Teilen</span>
                </button>
                
                {user && user.id === entry.author_id && (
                  <div className="flex items-center gap-2 ml-auto">
                    <button
                      onClick={() => router.push(`/logbuch/${entryId}/edit`)}
                      className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
                    >
                      <Edit size={16} />
                      <span>Bearbeiten</span>
                    </button>
                    <button
                      onClick={handleDeleteEntry}
                      className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors"
                    >
                      <Trash2 size={16} />
                      <span>Löschen</span>
                    </button>
                  </div>
                )}
              </div>
            </article>

            {/* Comment Form */}
            {showCommentForm && (
              <div className="bg-white/5 rounded-lg p-6 mb-8">
                <h3 className="text-lg font-semibold text-white mb-4">Kommentar hinzufügen</h3>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Schreiben Sie einen Kommentar..."
                  className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white placeholder-white/50 resize-none"
                  rows={4}
                />
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                    className="btn-accent disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Kommentar hinzufügen
                  </button>
                  <button
                    onClick={() => setShowCommentForm(false)}
                    className="btn-secondary"
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            )}

            {/* Comments */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Kommentare ({comments.length})</h3>
              {comments.map((comment) => (
                <div key={comment.id} className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white font-semibold text-sm">
                      {commentProfiles[comment.author_id]?.name?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-white text-sm">
                          {commentProfiles[comment.author_id]?.name || 'Unbekannt'}
                        </span>
                        <span className="text-white/50 text-xs">
                          {new Date(comment.created_at).toLocaleDateString('de-DE')}
                        </span>
                      </div>
                      <p className="text-white/80 text-sm">{comment.text}</p>
                      {user && user.id === comment.author_id && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-red-400 hover:text-red-300 text-xs mt-2"
                        >
                          Löschen
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundaryClient>
  );
}
