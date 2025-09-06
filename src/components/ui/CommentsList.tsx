'use client';

import { useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import CommentBlock from './CommentBlock';
import CommentForm from './CommentForm';
import { Comment } from '@/lib/types';

interface CommentsListProps {
  comments: Comment[];
  onAddComment: (text: string, images?: string[]) => void;
  onLikeComment: (commentId: string) => void;
  onEditComment: (commentId: string, text: string) => void;
  onDeleteComment: (commentId: string) => void;
  onAddReply: (parentId: string, text: string, images?: string[]) => void;
  onLikeReply: (parentId: string, replyId: string) => void;
  onEditReply: (parentId: string, replyId: string, text: string) => void;
  onDeleteReply: (parentId: string, replyId: string) => void;
  isSubmitting?: boolean;
  title?: string;
  showTitle?: boolean;
}

export default function CommentsList({
  comments,
  onAddComment,
  onLikeComment,
  onEditComment,
  onDeleteComment,
  onAddReply,
  onLikeReply,
  onEditReply,
  onDeleteReply,
  isSubmitting = false,
  title = "Kommentare",
  showTitle = true
}: CommentsListProps) {
  const { user } = useAuth();

  // Группируем комментарии: основные и ответы
  const mainComments = comments.filter(comment => !comment.parentId);
  const replies = comments.filter(comment => comment.parentId);

  // Добавляем ответы к основным комментариям
  const commentsWithReplies = mainComments.map(comment => ({
    ...comment,
    replies: replies.filter(reply => reply.parentId === comment.id)
  }));

  const handleAddComment = (text: string, images?: string[]) => {
    onAddComment(text, images);
  };

  const handleAddReply = (parentId: string, text: string, images?: string[]) => {
    onAddReply(parentId, text, images);
  };

  return (
    <div className="space-y-4">
      {/* Заголовок */}
      {showTitle && (
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white/90">{title}</h2>
          <span className="text-xs text-white/60">
            {mainComments.length} {mainComments.length === 1 ? 'Kommentar' : 'Kommentare'}
          </span>
        </div>
      )}

      {/* Форма добавления комментария */}
      <CommentForm
        onSubmit={handleAddComment}
        placeholder="Kommentar schreiben..."
        buttonText="Senden"
        isSubmitting={isSubmitting}
      />

      {/* Список комментариев */}
      {commentsWithReplies.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-sm text-white/60">
            Noch keine Kommentare. Seien Sie der Erste!
          </p>
        </div>
      ) : (
        <div className="space-y-0">
          {commentsWithReplies.map((comment) => (
            <CommentBlock
              key={comment.id}
              comment={comment}
              currentUserEmail={user?.email}
              onLike={onLikeComment}
              onReply={handleAddReply}
              onEdit={onEditComment}
              onDelete={onDeleteComment}
              onLikeReply={onLikeReply}
              onEditReply={onEditReply}
              onDeleteReply={onDeleteReply}
            />
          ))}
        </div>
      )}
    </div>
  );
}
