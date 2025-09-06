'use client';

import { useState } from 'react';
import { Heart, MessageCircle, Edit2, Trash2, Reply } from 'lucide-react';
import { Comment } from '@/lib/types';
import { useAuth } from '@/components/AuthProvider';

interface CommentsSectionProps {
  comments: Comment[];
  onAddComment: (text: string) => void;
  onLikeComment: (commentId: string) => void;
  onEditComment: (commentId: string, newText: string) => void;
  onDeleteComment: (commentId: string) => void;
  onAddReply: (parentId: string, text: string) => void;
  onLikeReply: (commentId: string, replyId: string) => void;
  onEditReply: (commentId: string, replyId: string, newText: string) => void;
  onDeleteReply: (commentId: string, replyId: string) => void;
  title?: string;
}

export default function CommentsSection({
  comments,
  onAddComment,
  onLikeComment,
  onEditComment,
  onDeleteComment,
  onAddReply,
  onLikeReply,
  onEditReply,
  onDeleteReply,
  title = "Kommentare"
}: CommentsSectionProps) {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim() && user) {
      onAddComment(newComment.trim());
      setNewComment('');
    }
  };

  const handleEditSubmit = (commentId: string) => {
    if (editText.trim()) {
      onEditComment(commentId, editText.trim());
      setEditingComment(null);
      setEditText('');
    }
  };

  const handleReplySubmit = (parentId: string) => {
    if (replyText.trim() && user) {
      onAddReply(parentId, replyText.trim());
      setReplyingTo(null);
      setReplyText('');
    }
  };

  const startEdit = (comment: Comment) => {
    setEditingComment(comment.id);
    setEditText(comment.text);
  };

  const startReply = (commentId: string) => {
    setReplyingTo(commentId);
    setReplyText('');
  };

  const canEdit = (comment: Comment) => {
    return user && (comment.userId === user.id || user.email === comment.authorEmail);
  };

  const canDelete = (comment: Comment) => {
    return user && (comment.userId === user.id || user.email === comment.authorEmail);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'gerade eben';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d`;
    return date.toLocaleDateString('de-DE');
  };

  return (
    <div className="bg-white/5 rounded-xl p-6">
      <h3 className="text-xl font-semibold text-white mb-6">{title}</h3>

      {/* Add Comment Form */}
      {user ? (
        <form onSubmit={handleSubmitComment} className="mb-8">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-white font-semibold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Schreiben Sie einen Kommentar..."
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                rows={3}
              />
              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={!newComment.trim()}
                  className="btn-accent px-4 py-2 disabled:opacity-50"
                >
                  Kommentieren
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-8 p-4 bg-white/5 rounded-lg text-center">
          <p className="text-white/70">
            Войдите, чтобы комментировать
          </p>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-6">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-white font-semibold">
              {comment.author.charAt(0).toUpperCase()}
            </div>
            
            <div className="flex-1">
              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{comment.author}</span>
                    <span className="text-white/50 text-sm">
                      {formatTimeAgo(comment.createdAt)}
                    </span>
                    {comment.editedAt && (
                      <span className="text-white/30 text-xs">(bearbeitet)</span>
                    )}
                  </div>
                  
                  {user && (
                    <div className="flex items-center gap-2">
                      {canEdit(comment) && (
                        <button
                          onClick={() => startEdit(comment)}
                          className="text-white/50 hover:text-white transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                      {canDelete(comment) && (
                        <button
                          onClick={() => onDeleteComment(comment.id)}
                          className="text-white/50 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {editingComment === comment.id ? (
                  <div className="space-y-3">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditSubmit(comment.id)}
                        className="px-3 py-1 bg-accent hover:bg-accent/80 rounded text-white text-sm"
                      >
                        Speichern
                      </button>
                      <button
                        onClick={() => setEditingComment(null)}
                        className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-white text-sm"
                      >
                        Abbrechen
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-white/90 whitespace-pre-wrap">{comment.text}</p>
                )}

                <div className="flex items-center gap-4 mt-3">
                  <button
                    onClick={() => onLikeComment(comment.id)}
                    disabled={!user}
                    className={`flex items-center gap-1 text-sm transition-colors ${
                      comment.likes.includes(user?.id || '')
                        ? 'text-accent'
                        : 'text-white/50 hover:text-white'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${comment.likes.includes(user?.id || '') ? 'fill-current' : ''}`} />
                    {comment.likes.length}
                  </button>
                  
                  {user && (
                    <button
                      onClick={() => startReply(comment.id)}
                      className="flex items-center gap-1 text-sm text-white/50 hover:text-white transition-colors"
                    >
                      <Reply className="w-4 h-4" />
                      Antworten
                    </button>
                  )}
                </div>
              </div>

              {/* Reply Form */}
              {replyingTo === comment.id && (
                <div className="mt-3 ml-4">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white font-semibold text-sm">
                      {user?.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Antwort schreiben..."
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                        rows={2}
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleReplySubmit(comment.id)}
                          className="px-3 py-1 bg-accent hover:bg-accent/80 rounded text-white text-sm"
                        >
                          Antworten
                        </button>
                        <button
                          onClick={() => setReplyingTo(null)}
                          className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-white text-sm"
                        >
                          Abbrechen
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="mt-4 space-y-3">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="flex gap-3 ml-4">
                      <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white font-semibold text-sm">
                        {reply.author.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="bg-white/5 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-white text-sm">{reply.author}</span>
                              <span className="text-white/50 text-xs">
                                {formatTimeAgo(reply.createdAt)}
                              </span>
                              {reply.editedAt && (
                                <span className="text-white/30 text-xs">(bearbeitet)</span>
                              )}
                            </div>
                            
                            {user && canEdit(reply) && (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => onEditReply(comment.id, reply.id, reply.text)}
                                  className="text-white/50 hover:text-white transition-colors"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => onDeleteReply(comment.id, reply.id)}
                                  className="text-white/50 hover:text-red-400 transition-colors"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                          <p className="text-white/90 text-sm whitespace-pre-wrap">{reply.text}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() => onLikeReply(comment.id, reply.id)}
                              disabled={!user}
                              className={`flex items-center gap-1 text-xs transition-colors ${
                                reply.likes.includes(user?.id || '')
                                  ? 'text-accent'
                                  : 'text-white/50 hover:text-white'
                              }`}
                            >
                              <Heart className={`w-3 h-3 ${reply.likes.includes(user?.id || '') ? 'fill-current' : ''}`} />
                              {reply.likes.length}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {comments.length === 0 && (
        <div className="text-center py-8">
          <MessageCircle className="w-12 h-12 text-white/30 mx-auto mb-4" />
          <p className="text-white/50">Noch keine Kommentare</p>
        </div>
      )}
    </div>
  );
}
