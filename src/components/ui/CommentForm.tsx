'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import AvatarTooltip from './AvatarTooltip';

interface CommentFormProps {
  onSubmit: (text: string, images?: string[]) => void;
  placeholder?: string;
  buttonText?: string;
  isSubmitting?: boolean;
}

export default function CommentForm({
  onSubmit,
  placeholder = "Kommentar schreiben...",
  buttonText = "Senden",
  isSubmitting = false
}: CommentFormProps) {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const openImagePreview = (image: string) => {
    setPreviewImage(image);
    // Небольшая задержка для плавного появления
    setTimeout(() => {
      setIsAnimating(true);
    }, 10);
  };

  const closeImagePreview = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setPreviewImage(null);
    }, 300); // Ждем завершения анимации
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((text.trim() || images.length > 0) && !isSubmitting) {
      // Сохраняем изображения в переменную перед очисткой состояния
      const imagesToSubmit = [...images];
      
      onSubmit(text.trim(), imagesToSubmit);
      setText('');
      setImages([]);
    }
  };

  if (!user) {
    return (
      <div className="p-4 bg-white/5 rounded-lg text-center">
        <p className="text-sm text-white/60">
          Melden Sie sich an, um einen Kommentar zu hinterlassen
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      <div className="flex-shrink-0">
        <AvatarTooltip
          src={null}
          name={user.name || user.email || 'User'}
          size={32}
          userInfo={{
            displayName: user.name || user.email || 'User',
            fullName: user.name || user.email || 'User',
            city: 'München', // TODO: Получать из профиля
            about: 'Sie'
          }}
          showActions={false}
        />
      </div>
      
      <div className="flex-1">
        <textarea
          id="comment-text"
          name="comment-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          className="form-input text-sm resize-none"
          rows={3}
          disabled={isSubmitting}
        />
        
        
        <div className="flex justify-end items-center gap-2 mt-2">
          {/* Превью изображений - справа рядом с кнопками */}
          {images.length > 0 && (
            <div className="flex gap-2">
              {images.map((image, index) => (
                <div key={index} className="relative w-12 h-12 rounded-lg overflow-hidden border border-white/20 cursor-pointer group" onClick={() => openImagePreview(image)}>
                  <img
                    src={image}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover transition-all duration-300 group-hover:scale-110"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setImages(prev => prev.filter((_, i) => i !== index));
                    }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-xs hover:bg-red-600 transition-colors"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Кнопка прикрепления фото */}
          <input
            type="file"
            id="comment-image-upload"
            accept="image/*"
            multiple
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              if (files.length > 0) {
                // Обрабатываем файлы по одному
                files.forEach((file, index) => {
                  const reader = new FileReader();
                  reader.onload = (e) => {
                    const result = e.target?.result as string;
                    if (result) {
                      setImages(prev => {
                        const updated = [...prev, result].slice(0, 3);
                        return updated;
                      });
                    }
                  };
                  reader.onerror = (error) => {
                    console.error(`Error reading file ${index + 1}:`, error);
                  };
                  reader.readAsDataURL(file);
                });
              }
            }}
            className="hidden"
            disabled={isSubmitting}
          />
          <label
            htmlFor="comment-image-upload"
            className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border border-accent"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
              <circle cx="12" cy="13" r="3"/>
            </svg>
          </label>
          
          <button
            type="submit"
            disabled={(!text.trim() && images.length === 0) || isSubmitting}
            className="btn-primary text-xs px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Senden...' : buttonText}
          </button>
        </div>
      </div>
      
      {/* Модальное окно для предварительного просмотра изображения */}
      {previewImage && (
        <div 
          className={`fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${
            isAnimating ? 'opacity-100' : 'opacity-0'
          }`} 
          onClick={closeImagePreview}
        >
          <div className="relative max-w-4xl max-h-full w-full h-full flex items-center justify-center">
            {/* Кнопка закрытия */}
            <button
              onClick={closeImagePreview}
              className="absolute top-4 right-4 z-10 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all duration-200 hover:scale-110"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            {/* Изображение с анимацией */}
            <div 
              className={`relative w-full h-full flex items-center justify-center transition-all duration-300 ${
                isAnimating ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
              }`} 
            >
              <img
                src={previewImage}
                alt="Preview"
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer"
                onClick={closeImagePreview}
              />
            </div>

            {/* Подсказка для закрытия */}
            <div className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-white/80 text-sm transition-opacity duration-300 ${
              isAnimating ? 'opacity-100' : 'opacity-0'
            }`}>
              Klicken Sie zum Schließen
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
