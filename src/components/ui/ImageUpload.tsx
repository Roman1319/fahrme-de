'use client';

import { useRef, useState, useCallback } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface ImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  maxSize?: number; // в MB
  minWidth?: number;
  minHeight?: number;
}

export default function ImageUpload({
  images,
  onImagesChange,
  maxImages = 10,
  maxSize = 5,
  minWidth = 480,
  minHeight = 270
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Конвертируем файл в base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // Валидация изображения
  const validateImage = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!file.type.startsWith('image/')) {
        alert('Bitte wählen Sie eine gültige Bilddatei aus.');
        resolve(false);
        return;
      }

      if (file.size > maxSize * 1024 * 1024) {
        alert(`Die Bilddatei ist zu groß. Maximale Größe: ${maxSize}MB`);
        resolve(false);
        return;
      }

      const img = new Image();
      img.onload = () => {
        if (img.width < minWidth || img.height < minHeight) {
          alert(`Das Bild ist zu klein. Mindestgröße: ${minWidth}×${minHeight} Pixel`);
          resolve(false);
          return;
        }
        resolve(true);
      };
      img.onerror = () => {
        alert('Fehler beim Laden des Bildes.');
        resolve(false);
      };
      img.src = URL.createObjectURL(file);
    });
  };

  // Обработка файлов
  const handleFiles = useCallback(async (files: FileList) => {
    if (images.length + files.length > maxImages) {
      alert(`Maximale Anzahl von ${maxImages} Bildern erreicht.`);
      return;
    }

    setUploading(true);
    const newImages: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (await validateImage(file)) {
        try {
          const base64 = await fileToBase64(file);
          newImages.push(base64);
        } catch (error) {
          console.error('Error converting file to base64:', error);
          alert(`Fehler beim Verarbeiten von ${file.name}`);
        }
      }
    }

    if (newImages.length > 0) {
      onImagesChange([...images, ...newImages]);
    }

    setUploading(false);
  }, [images, onImagesChange, maxImages, maxSize, minWidth, minHeight]);

  // Обработчики drag & drop
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  // Обработчик клика по input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  // Удаление изображения
  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  return (
    <div className="space-y-4">
      {/* Drag & Drop область */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${dragActive 
            ? 'border-primary bg-primary/5' 
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }
          ${uploading ? 'opacity-50 pointer-events-none' : ''}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleInputChange}
          className="hidden"
        />
        
        <div className="space-y-2">
          <Upload size={32} className="mx-auto text-gray-400" />
          <div>
            <p className="text-sm font-medium">
              Bilder hierher ziehen oder{' '}
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="text-primary hover:underline"
              >
                durchsuchen
              </button>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              JPEG, PNG, WebP • Max. {maxSize}MB • Min. {minWidth}×{minHeight}px
            </p>
          </div>
        </div>

        {uploading && (
          <div className="absolute inset-0 bg-white/80 dark:bg-black/80 flex items-center justify-center rounded-lg">
            <div className="text-sm">Bilder werden verarbeitet...</div>
          </div>
        )}
      </div>

      {/* Список загруженных изображений */}
      {images.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Hochgeladene Bilder ({images.length}/{maxImages})</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {images.map((image, index) => (
              <div key={index} className="relative group">
                <div className="aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                  <img
                    src={image}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={12} />
                </button>
                <div className="absolute bottom-1 left-1 right-1">
                  <div className="bg-black/70 text-white text-xs px-2 py-1 rounded text-center">
                    {index + 1}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Кнопка добавления еще изображений */}
      {images.length < maxImages && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full py-3 border border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center gap-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <ImageIcon size={16} />
          Weitere Bilder hinzufügen
        </button>
      )}
    </div>
  );
}
