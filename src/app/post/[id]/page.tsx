'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Heart, MessageCircle, User, Trash2, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { getTopicLabel, getTopicIcon, getTopicColor } from '@/lib/logbook-topics';
import { LogbookEntry, LogbookMedia, Comment, Car as CarType, Profile } from '@/lib/types';
import ErrorBoundaryClient from '@/components/ErrorBoundaryClient';

// Helper function to get media URL
function getLogbookMediaUrl(storagePath: string): string {
  // This should be replaced with actual Supabase storage URL generation
  // For now, return a placeholder or construct the URL
  return `https://your-supabase-project.supabase.co/storage/v1/object/public/logbook/${storagePath}`;
}

export default function PostPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const entryId = params.id as string;

  const [entry, setEntry] = useState<LogbookEntry | null>(null);
  const [car, setCar] = useState<CarType | null>(null);
  const [author, setAuthor] = useState<Profile | null>(null);
  const [media, setMedia] = useState<LogbookMedia[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [showMediaUpload, setShowMediaUpload] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  useEffect(() => {
    if (!entryId) return;
    
    setIsLoading(true);
    setError(null);
    
    fetch(`/api/logbook/${entryId}`)
      .then(response => response.json())
      .then(async (fetchedEntry) => {
        if (!fetchedEntry) {
          setError('Post not found');
          return;
        }
        setEntry(fetchedEntry);

        // Fetch all data in parallel
        Promise.all([
          fetch(`/api/cars/${fetchedEntry.car_id}`).then(r => r.json()),
          fetch(`/api/profiles/${fetchedEntry.author_id}`).then(r => r.json()),
          fetch(`/api/logbook/${entryId}/media`).then(r => r.json()),
          fetch(`/api/logbook/${entryId}/comments`).then(r => r.json())
        ]).then(([fetchedCar, fetchedAuthor, fetchedMedia, fetchedComments]) => {

          setCar(fetchedCar);
          setAuthor(fetchedAuthor);
          setMedia(fetchedMedia);
          setComments(fetchedComments);
          setCommentCount(fetchedComments.length);

          // Fetch like status and count (temporarily disabled)
          if (user) {
            setIsLiked(false);
          }
          setLikeCount(0);
        });
      })
      .catch(err => {
        console.error('Error loading post data:', err);
        setError('Failed to load post');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [entryId, user]);

  const handleLike = () => {
    if (!user || !entry) return;

    // Временно отключено из-за проблем с post_likes таблицей
    console.log('Like functionality temporarily disabled');
  };

  const handleAddComment = () => {
    if (!user || !entry || !newComment.trim()) return;

    fetch(`/api/logbook/${entryId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: newComment.trim(),
        authorId: user.id
      }),
    })
      .then(response => response.json())
      .then(comment => {
        setComments(prev => [...prev, comment]);
        setCommentCount(prev => prev + 1);
        setNewComment('');
        setShowCommentForm(false);
      })
      .catch(error => {
        console.error('Error adding comment:', error);
      });
  };

  const handleEditComment = (commentId: string) => {
    if (!editingCommentText.trim()) return;

    fetch(`/api/comments/${commentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: editingCommentText.trim()
      }),
    })
      .then(response => response.json())
      .then(updatedComment => {
        setComments(prev => prev.map(c => c.id === commentId ? updatedComment : c));
        setEditingComment(null);
        setEditingCommentText('');
      })
      .catch(error => {
        console.error('Error updating comment:', error);
      });
  };

  const handleDeleteComment = (commentId: string) => {
    fetch(`/api/comments/${commentId}`, {
      method: 'DELETE',
    })
      .then(() => {
        setComments(prev => prev.filter(c => c.id !== commentId));
        setCommentCount(prev => prev - 1);
      })
      .catch(error => {
        console.error('Error deleting comment:', error);
      });
  };

  // const handleLikeComment = (commentId: string) => {
  //   if (!user) return;

  //   try {
  //     await toggleCommentLike(commentId, user.id);
  //     // Refresh comment likes - in a real app you'd want to track this per comment
  //   } catch (error) {
  //     console.error('Error toggling comment like:', error);
  //   }
  // }; // TODO: Use handleLikeComment if needed

  const handleMediaUpload = (files: FileList) => {
    if (!user || !entry || uploadingMedia) return;

    setUploadingMedia(true);
    const fileArray = Array.from(files);
    const formData = new FormData();
    fileArray.forEach(file => formData.append('files', file));
    formData.append('entryId', entryId);
    formData.append('authorId', user.id);
    
    fetch('/api/logbook/media', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    })
      .then(response => response.json())
      .then(uploadedMedia => {
        setMedia(prev => [...prev, ...uploadedMedia]);
        setShowMediaUpload(false);
      })
      .catch(error => {
        console.error('Error uploading media:', error);
      })
      .finally(() => {
        setUploadingMedia(false);
      });
  };

  const handleDeleteMedia = (mediaId: string) => {
    fetch(`/api/logbook/media/${mediaId}`, {
      method: 'DELETE',
    })
      .then(() => {
        setMedia(prev => prev.filter(m => m.id !== mediaId));
      })
      .catch(error => {
        console.error('Error deleting media:', error);
      });
  };

  const handleDeletePost = () => {
    if (!entry || !user || entry.author_id !== user.id) return;

    if (confirm('Are you sure you want to delete this post?')) {
      fetch(`/api/logbook/${entryId}`, {
        method: 'DELETE',
      })
        .then(() => {
          router.push(`/car/${entry.car_id}`);
        })
        .catch(error => {
          console.error('Error deleting post:', error);
        });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading post...</p>
        </div>
      </div>
    );
  }

  if (error || !entry || !car || !author) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">{error || 'Post not found'}</p>
          <button 
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === entry.author_id;
  const canComment = entry.allow_comments;

  return (
    <ErrorBoundaryClient>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                {author.avatar_url ? (
                  <img 
                    src={author.avatar_url} 
                    alt={author.name || author.handle} 
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-5 h-5 text-gray-500" />
                )}
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {entry.title}
                </h1>
                <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                  <span>by {author.name || author.handle}</span>
                  <span>•</span>
                  <span>{car.brand} {car.model} ({car.year})</span>
                  <span>•</span>
                  <span>{new Date(entry.publish_date).toLocaleDateString()}</span>
                  {entry.topic && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <span>{getTopicIcon(entry.topic)}</span>
                        <span>{getTopicLabel(entry.topic)}</span>
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            {isOwner && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowMediaUpload(!showMediaUpload)}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  title="Add media"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={handleDeletePost}
                  className="p-2 text-red-500 hover:text-red-700"
                  title="Delete post"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="prose dark:prose-invert max-w-none">
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {entry.content}
            </p>
          </div>

          {/* Media Gallery */}
          {media.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Media</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {media.map((item) => (
                  <div key={item.id} className="relative group">
                    <img
                      src={getLogbookMediaUrl(item.storage_path)}
                      alt="Post media"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    {isOwner && (
                      <button
                        onClick={() => handleDeleteMedia(item.id)}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Media Upload */}
          {showMediaUpload && isOwner && (
            <div className="mt-6 p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={(e) => e.target.files && handleMediaUpload(e.target.files)}
                className="w-full"
                disabled={uploadingMedia}
              />
              {uploadingMedia && (
                <p className="mt-2 text-sm text-gray-500">Uploading...</p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleLike}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  isLiked 
                    ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400' 
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                <span>{likeCount}</span>
              </button>
              
              <button
                onClick={() => setShowCommentForm(!showCommentForm)}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                <MessageCircle className="w-4 h-4" />
                <span>{commentCount}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Comments */}
        {canComment && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Comments</h3>
            
            {/* Add Comment Form */}
            {user && showCommentForm && (
              <div className="mb-6">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  rows={3}
                />
                <div className="flex justify-end space-x-2 mt-2">
                  <button
                    onClick={() => setShowCommentForm(false)}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Post Comment
                  </button>
                </div>
              </div>
            )}

            {/* Comments List */}
            {comments.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                No comments yet. Be the first to comment!
              </p>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex space-x-3">
                    <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="flex-1">
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                        {editingComment === comment.id ? (
                          <div>
                            <textarea
                              value={editingCommentText}
                              onChange={(e) => setEditingCommentText(e.target.value)}
                              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:text-white"
                              rows={2}
                            />
                            <div className="flex justify-end space-x-2 mt-2">
                              <button
                                onClick={() => {
                                  setEditingComment(null);
                                  setEditingCommentText('');
                                }}
                                className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleEditComment(comment.id)}
                                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <p className="text-gray-800 dark:text-gray-200">{comment.text}</p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(comment.created_at).toLocaleString()}
                              </span>
                              {user?.id === comment.author_id && (
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => {
                                      setEditingComment(comment.id);
                                      setEditingCommentText(comment.text);
                                    }}
                                    className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteComment(comment.id)}
                                    className="text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!canComment && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 text-center">
            <p className="text-gray-500 dark:text-gray-400">Comments are disabled for this post.</p>
          </div>
        )}
        </div>
      </div>
    </ErrorBoundaryClient>
  );
}
