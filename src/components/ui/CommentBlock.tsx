'use client';

import { useState } from 'react';
import { Heart, MoreVertical, Edit, Trash2, X } from 'lucide-react';
import { Comment } from '@/lib/types';
import AvatarTooltip from './AvatarTooltip';
import Image from 'next/image';

interface CommentBlockProps {
  comment: Comment;
  currentUserEmail?: string;
  onLike: (commentId: string) => void;
  onReply: (commentId: string, text: string, images?: string[]) => void;
  onEdit: (commentId: string, text: string) => void;
  onDelete: (commentId: string) => void;
  onLikeReply?: (commentId: string, replyId: string) => void;
  onEditReply?: (commentId: string, replyId: string, text: string) => void;
  onDeleteReply?: (commentId: string, replyId: string) => void;
  level?: number; // Уровень вложенности (0 = основной комментарий)
}

export default function CommentBlock({
  comment,
  currentUserEmail,
  onLike,
  onReply,
  onEdit,
  onDelete,
  onLikeReply,
  onEditReply,
  onDeleteReply,
  level = 0
}: CommentBlockProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [editText, setEditText] = useState(comment.text);
  const [isLiked, setIsLiked] = useState(false); // TODO: Получать из состояния
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const isOwner = currentUserEmail === (comment as any).authorEmail;
  const isMainComment = level === 0;
  const maxLevel = 3; // Максимальная глубина вложенности

  const handleLike = () => {
    if (isMainComment) {
      onLike(comment.id);
    } else if (onLikeReply) {
      // Для ответов нужно передать parentId
      onLikeReply(comment.parent_id || '', comment.id);
    }
    setIsLiked(!isLiked);
  };

  const handleReply = () => {
    if (replyText.trim()) {
      onReply(comment.id, replyText.trim());
      setReplyText('');
      setIsReplying(false);
    }
  };

  const handleEdit = () => {
    if (editText.trim() && editText !== comment.text) {
      if (isMainComment) {
        onEdit(comment.id, editText.trim());
      } else if (onEditReply) {
        onEditReply(comment.parent_id || '', comment.id, editText.trim());
      }
      setIsEditing(false);
    }
  };

  const handleDelete = () => {
    if (isMainComment) {
      onDelete(comment.id);
    } else if (onDeleteReply) {
      onDeleteReply(comment.parent_id || '', comment.id);
    }
    setShowMenu(false);
  };

  const openImageModal = (index: number) => {
    setSelectedImageIndex(index);
    setShowImageModal(true);
    // Небольшая задержка для плавного появления
    setTimeout(() => {
      setIsAnimating(true);
    }, 10);
  };

  const closeImageModal = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setShowImageModal(false);
    }, 300); // Ждем завершения анимации
  };

  const nextImage = () => {
    if ((comment as any).images && Array.isArray((comment as any).images) && (comment as any).images.length > 0) {
      setSelectedImageIndex((prev) => (prev + 1) % (comment as any).images!.length);
    }
  };

  const prevImage = () => {
    if ((comment as any).images && Array.isArray((comment as any).images) && (comment as any).images.length > 0) {
      setSelectedImageIndex((prev) => (prev - 1 + (comment as any).images!.length) % (comment as any).images!.length);
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const commentTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - commentTime.getTime()) / 1000);

    if (diffInSeconds < 60) return 'только что';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} мин`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} ч`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} дн`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} мес`;
    return `${Math.floor(diffInSeconds / 31536000)} г`;
  };

  return (
    <div className={`${isMainComment ? 'mb-4' : 'mb-3'} ${level > 0 ? 'ml-8' : ''}`}>
      {/* Индикатор вложенности для ответов */}
      {level > 0 && (
        <div className="flex items-center mb-2">
          <div className="w-6 h-px bg-white/20 mr-2"></div>
          <span className="text-xs text-white/50">Antwort auf Kommentar</span>
        </div>
      )}
      
      {/* Основной комментарий */}
      <div className={`flex gap-3 ${level > 0 ? 'bg-white/5 rounded-lg p-3 border-l-2 border-accent/50' : ''}`}>
        {/* Аватар */}
        <div className="flex-shrink-0">
          <AvatarTooltip
            src={null}
            name={(comment as any).author}
            size={32}
            userInfo={{
              displayName: (comment as any).author,
              fullName: (comment as any).author,
              city: 'Мюнхен', // TODO: Получать из профиля
              about: 'Пользователь'
            }}
            showActions={false}
          />
        </div>

        {/* Контент комментария */}
        <div className="flex-1 min-w-0">
          {/* Информация о пользователе и автомобиле */}
          <div className="mb-1">
            <span className="font-semibold text-sm text-white/90">{(comment as any).author}</span>
            <span className="text-xs text-white/60 ml-2">
              Ich fahre BMW 3 Series (G20) {/* TODO: Получать из профиля пользователя */}
            </span>
          </div>

          {/* Текст комментария */}
          {isEditing ? (
            <div className="mb-2">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="form-input text-sm resize-none"
                rows={3}
                autoFocus
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleEdit}
                  className="btn-primary text-xs"
                >
                  Speichern
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditText(comment.text);
                  }}
                  className="btn-secondary text-xs"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-2">
              <p className="text-sm text-white/80 leading-relaxed">{comment.text}</p>
              {(comment as any).isEdited && (
                <span className="text-xs text-white/50">(bearbeitet)</span>
              )}
              
              {/* Изображения комментария */}
              {(comment as any).images && Array.isArray((comment as any).images) && (comment as any).images.length > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-2 max-w-sm">
                  {(comment as any).images.map((image: any, index: any) => (
                    <div
                      key={index}
                      className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group max-h-32"
                      onClick={() => openImageModal(index)}
                    >
                      <Image
                        src={image}
                        alt={`Комментарий ${index + 1}`}
                        fill
                        sizes="(max-width: 768px) 50vw, 200px"
                        className="object-cover transition-transform group-hover:scale-105"
                        quality={75}
                        onError={(e) => {
                          console.error('Error loading image:', e);
                          console.log('Image src:', image);
                        }}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                    </div>
                  ))}
                </div>
              )}
              
            </div>
          )}

          {/* Действия */}
          {!isEditing && (
            <div className="flex items-center gap-4 text-xs">
              {/* Лайк */}
              <button
                onClick={handleLike}
                className={`flex items-center gap-1 transition-colors ${
                  isLiked ? 'text-red-500' : 'text-white/60 hover:text-white/80'
                }`}
              >
                <Heart size={14} className={isLiked ? 'fill-current' : ''} />
                <span>{(comment as any).likes || 0}</span>
              </button>

              {/* Ответ */}
              {level < maxLevel && (
                <button
                  onClick={() => setIsReplying(true)}
                  className="text-white/60 hover:text-white/80 transition-colors"
                >
                  {level === 0 ? 'Antworten' : 'Antworten auf ' + (comment as any).author}
                </button>
              )}

              {/* Время */}
              <span className="text-white/50">
                {formatTimeAgo((comment as any).timestamp || comment.created_at)}
              </span>

              {/* Меню действий (только для владельца) */}
              {isOwner && (
                <div className="relative">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="text-white/50 hover:text-white/80 transition-colors"
                  >
                    <MoreVertical size={14} />
                  </button>
                  
                  {showMenu && (
                    <div className="absolute right-0 top-6 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 py-1 z-10">
                      <button
                        onClick={() => {
                          setIsEditing(true);
                          setShowMenu(false);
                        }}
                        className="w-full px-3 py-2 text-left text-xs text-white/80 hover:bg-white/10 flex items-center gap-2"
                      >
                        <Edit size={12} />
                        Bearbeiten
                      </button>
                      <button
                        onClick={handleDelete}
                        className="w-full px-3 py-2 text-left text-xs text-red-400 hover:bg-red-400/10 flex items-center gap-2"
                      >
                        <Trash2 size={12} />
                        Löschen
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Форма ответа */}
          {isReplying && (
            <div className="mt-3">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Antwort schreiben..."
                className="form-input text-sm resize-none"
                rows={2}
                autoFocus
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleReply}
                  className="btn-primary text-xs"
                >
                  Antworten
                </button>
                <button
                  onClick={() => {
                    setIsReplying(false);
                    setReplyText('');
                  }}
                  className="btn-secondary text-xs"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Вложенные комментарии */}
      {(comment as any).replies && (comment as any).replies.length > 0 && (
        <div className="mt-3 relative">
          {/* Вертикальная линия для соединения ответов */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-white/10"></div>
          
          <div className="space-y-2">
            {(comment as any).replies.map((reply: any) => (
              <div key={reply.id} className="relative">
                {/* Горизонтальная линия к ответу */}
                <div className="absolute left-4 top-6 w-4 h-px bg-white/10"></div>
                <CommentBlock
                  comment={reply}
                  currentUserEmail={currentUserEmail}
                  onLike={onLike}
                  onReply={onReply}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onLikeReply={onLikeReply}
                  onEditReply={onEditReply}
                  onDeleteReply={onDeleteReply}
                  level={level + 1}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Модальное окно для просмотра изображений */}
      {showImageModal && (comment as any).images && Array.isArray((comment as any).images) && (comment as any).images.length > 0 && (
        <div 
          className={`fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${
            isAnimating ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={closeImageModal}
        >
          <div className="relative max-w-3xl max-h-[90vh] w-full h-full flex items-center justify-center">
            {/* Кнопка закрытия */}
            <button
              onClick={closeImageModal}
              className="absolute top-4 right-4 z-10 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all duration-200 hover:scale-110"
            >
              <X size={24} className="text-white" />
            </button>

            {/* Изображение с анимацией */}
            <div 
              className={`relative w-full h-full flex items-center justify-center transition-all duration-300 ${
                isAnimating ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
              }`}
            >
              <Image
                src={(comment as any).images[selectedImageIndex]}
                alt={`Комментарий ${selectedImageIndex + 1}`}
                width={800}
                height={600}
                sizes="(max-width: 768px) 90vw, (max-width: 1200px) 70vw, 60vw"
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer"
                onClick={closeImageModal}
                quality={85}
              />
            </div>

            {/* Навигация */}
            {(comment as any).images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    prevImage();
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all duration-200 hover:scale-110"
                >
                  <X size={24} className="text-white rotate-90" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    nextImage();
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all duration-200 hover:scale-110"
                >
                  <X size={24} className="text-white -rotate-90" />
                </button>
              </>
            )}

            {/* Счетчик изображений */}
            <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/10 px-3 py-1 rounded-full text-sm text-white transition-opacity duration-300 ${
              isAnimating ? 'opacity-100' : 'opacity-0'
            }`}>
              {selectedImageIndex + 1} / {(comment as any).images.length}
            </div>

            {/* Подсказка для закрытия */}
            <div className={`absolute bottom-16 left-1/2 transform -translate-x-1/2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-white/80 text-sm transition-opacity duration-300 ${
              isAnimating ? 'opacity-100' : 'opacity-0'
            }`}>
              Klicken Sie zum Schließen
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
