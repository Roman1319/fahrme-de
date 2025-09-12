'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { CreateLogbookEntryData } from '@/lib/logbook';
import { safeApiCall, waitForAuth } from '@/lib/api-client';
import { AuthBlockedButton } from '@/components/ui/AuthBlockedButton';
import { useCarOwnership } from '@/hooks/useCarOwnership';
import { useToast } from '@/components/ui/Toast';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  carId: string;
  authorId: string;
  onPostCreated: (entryId: string) => void;
}

export default function CreatePostModal({ 
  isOpen, 
  onClose, 
  carId, 
  authorId, 
  onPostCreated 
}: CreatePostModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [allowComments, setAllowComments] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  
  const { isOwner, loading: ownershipLoading, canCreatePost } = useCarOwnership(carId);
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || isSubmitting) return;

    // UI-валидация: проверяем принадлежность автомобиля
    if (!canCreatePost) {
      toast.error(
        'Нет прав на создание поста',
        'Пост можно создавать только для своих автомобилей'
      );
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Ждем готовности аутентификации
      await waitForAuth();

      const entryData: CreateLogbookEntryData = {
        car_id: carId,
        title: title.trim(),
        content: content.trim(),
        allow_comments: allowComments
      };

      // Create logbook entry via API с безопасным вызовом
      const entry = await safeApiCall('/api/logbook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entryData),
      });

      // Upload media if any
      if (selectedFiles.length > 0) {
        setUploadingMedia(true);
        const formData = new FormData();
        selectedFiles.forEach(file => formData.append('file', file));
        formData.append('entryId', entry.id);
        
        try {
          await safeApiCall('/api/logbook/media', {
            method: 'POST',
            body: formData,
          });
          
          toast.success(
            'Медиа загружено',
            'Фотографии успешно добавлены к посту'
          );
        } catch (error) {
          console.error('Error uploading media:', error);
          toast.warning(
            'Ошибка загрузки медиа',
            'Пост создан, но не удалось загрузить фотографии'
          );
        } finally {
          setUploadingMedia(false);
        }
      }

      toast.success(
        'Пост создан',
        'Ваш пост успешно опубликован'
      );
      
      onPostCreated(entry.id);
      handleClose();
    } catch (err: unknown) {
      console.error('Error creating post:', err);
      
      let errorMessage = 'Произошла ошибка при создании поста';
      
      if (err && typeof err === 'object' && 'code' in err && err.code === '42501') {
        errorMessage = 'Пост можно создавать только для своих автомобилей';
      } else if (err instanceof Error) {
        if (err.message.includes('403') || err.message.includes('Forbidden')) {
          errorMessage = 'Пост можно создавать только для своих автомобилей';
        } else if (err.message.includes('Unauthorized')) {
          errorMessage = 'Необходимо войти в систему';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      toast.error(
        'Ошибка создания поста',
        errorMessage
      );
    } finally {
      setIsSubmitting(false);
      setUploadingMedia(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setContent('');
    setAllowComments(true);
    setError(null);
    setSelectedFiles([]);
    onClose();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Neuer Logbuch-Eintrag
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {ownershipLoading && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-blue-600 dark:text-blue-400 text-sm">
                Проверка прав на создание поста...
              </p>
            </div>
          )}
          
          {!ownershipLoading && !canCreatePost && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-600 dark:text-red-400 text-sm">
                Пост можно создавать только для своих автомобилей
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Titel *
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="Titel des Eintrags..."
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Inhalt *
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="Beschreiben Sie Ihren Eintrag..."
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={allowComments}
                onChange={(e) => setAllowComments(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                disabled={isSubmitting}
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Kommentare erlauben
              </span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Medien hinzufügen (optional)
            </label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="w-full"
                disabled={isSubmitting || uploadingMedia}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Bilder und Videos werden unterstützt
              </p>
            </div>

            {selectedFiles.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ausgewählte Dateien:
                </h4>
                <div className="space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
                      <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                        {file.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-red-500 hover:text-red-700 text-sm"
                        disabled={isSubmitting || uploadingMedia}
                      >
                        Entfernen
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              disabled={isSubmitting}
            >
              Abbrechen
            </button>
            <AuthBlockedButton
              type="submit"
              disabled={!title.trim() || !content.trim() || isSubmitting || !canCreatePost || ownershipLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>{uploadingMedia ? 'Lade Medien hoch...' : 'Erstelle...'}</span>
                </>
              ) : (
                <span>Post erstellen</span>
              )}
            </AuthBlockedButton>
          </div>
        </form>
      </div>
    </div>
  );
}
