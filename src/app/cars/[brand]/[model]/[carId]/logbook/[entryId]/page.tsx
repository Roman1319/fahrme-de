'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { getCar } from '@/lib/cars';
import { getLogbookEntry, deleteLogbookEntry } from '@/lib/logbook-operations';
import { getComments, addComment, deleteComment } from '@/lib/comments';
import { MyCar, LogbookEntry, Comment } from '@/lib/types';
import { getProfile } from '@/lib/profiles';
// import { formatDistanceToNow } from 'date-fns';
// import { de } from 'date-fns/locale';

export default function LogbookEntryPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const carId = params.carId as string;
  const entryId = params.entryId as string;
  
  const [car, setCar] = useState<MyCar | null>(null);
  const [entry, setEntry] = useState<LogbookEntry | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentProfiles, setCommentProfiles] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);

  // Load car data
  useEffect(() => {
    if (carId) {
      getCar(carId)
        .then(carData => {
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
      getLogbookEntry(entryId)
        .then(entryData => {
          if (entryData) {
            setEntry(entryData);
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
      getComments(entryId)
        .then(commentsData => {
          setComments(commentsData);
        })
        .catch(error => {
          console.error('Error loading comments:', error);
        });
    }
  }, [entryId]);

  // Load comment profiles
  useEffect(() => {
    if (comments.length > 0) {
      const loadProfiles = () => {
        const profiles: Record<string, any> = {};
        const profilePromises = comments
          .filter(comment => !commentProfiles[comment.author_id])
          .map(comment => 
            getProfile(comment.author_id)
              .then(profile => {
                profiles[comment.author_id] = profile;
              })
              .catch(error => {
                console.error('Error loading profile:', error);
              })
          );
        
        Promise.all(profilePromises).then(() => {
          setCommentProfiles(prev => ({ ...prev, ...profiles }));
        });
      };
      loadProfiles();
    }
  }, [comments, commentProfiles]);

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

  const handleEditComment = (commentId: string, newText: string) => {
    if (!newText.trim()) return;

    // Временно отключено - нет функции updateComment
    console.log('Edit comment:', commentId, newText);
  };

  const handleDeleteComment = (commentId: string) => {
    deleteComment(commentId)
      .then(() => {
        setComments(prev => prev.filter(c => c.id !== commentId));
      })
      .catch(error => {
        console.error('Error deleting comment:', error);
      });
  };

  const handleLikeComment = (commentId: string) => {
    if (!user) return;

    // Временно отключено - нет функции likeComment
    console.log('Like comment:', commentId);
  };

  const handleDeleteEntry = () => {
    if (!user || !entry || entry.author_id !== user.id) return;

    if (confirm('Möchten Sie diesen Eintrag wirklich löschen?')) {
      deleteLogbookEntry(entryId)
        .then(() => {
          router.push(`/cars/${car?.make}/${car?.model}/${carId}`);
        })
        .catch(error => {
          console.error('Error deleting entry:', error);
        });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Lade Eintrag...</p>
        </div>
      </div>
    );
  }

  if (error || !car || !entry) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Eintrag nicht gefunden</h1>
          <p className="text-muted-foreground mb-4">
            {error || 'Der angeforderte Eintrag konnte nicht geladen werden.'}
          </p>
          <button
            onClick={() => router.back()}
            className="btn-primary"
          >
            Zurück
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.back()}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Zurück
            </button>
            
            {user && user.id === entry.author_id && (
              <button
                onClick={handleDeleteEntry}
                className="text-destructive hover:text-destructive/80 transition-colors"
              >
                Löschen
              </button>
            )}
          </div>
          
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {entry.title}
          </h1>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>
              {new Date(entry.created_at).toLocaleDateString('de-DE')}
            </span>
            <span>•</span>
            <span>{car.make} {car.model}</span>
          </div>
        </div>

        {/* Content */}
        <div className="bg-card rounded-lg p-6 mb-6">
          <div className="prose prose-gray max-w-none">
            <div className="whitespace-pre-wrap text-foreground">
              {entry.content}
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="bg-card rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">
              Kommentare ({comments.length})
            </h2>
            
            {user && (
              <button
                onClick={() => setShowCommentForm(!showCommentForm)}
                className="btn-primary"
              >
                {showCommentForm ? 'Abbrechen' : 'Kommentieren'}
              </button>
            )}
          </div>

          {/* Comment Form */}
          {showCommentForm && user && (
            <div className="mb-6">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Schreiben Sie einen Kommentar..."
                className="w-full p-3 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                rows={3}
              />
              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={() => setShowCommentForm(false)}
                  className="btn-secondary"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  className="btn-primary disabled:opacity-50"
                >
                  Kommentieren
                </button>
              </div>
            </div>
          )}

          {/* Comments List */}
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="border-b border-border pb-4 last:border-b-0">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
                    {commentProfiles[comment.author_id]?.name?.charAt(0) || '?'}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-foreground">
                        {commentProfiles[comment.author_id]?.name || 'Unbekannt'}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(comment.created_at).toLocaleDateString('de-DE')}
                      </span>
                    </div>
                    
                    <p className="text-foreground mb-2">{comment.text}</p>
                    
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleLikeComment(comment.id)}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        👍 0
                      </button>
                      
                      {user && user.id === comment.author_id && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              const newText = prompt('Kommentar bearbeiten:', comment.text);
                              if (newText && newText !== comment.text) {
                                handleEditComment(comment.id, newText);
                              }
                            }}
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                          >
                            Bearbeiten
                          </button>
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-sm text-destructive hover:text-destructive/80 transition-colors"
                          >
                            Löschen
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {comments.length === 0 && (
              <p className="text-muted-foreground text-center py-8">
                Noch keine Kommentare. Seien Sie der Erste!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}