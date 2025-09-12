'use client';

import { useState, useRef, useCallback } from 'react';
import { ImageIcon, X, Upload } from 'lucide-react';

interface PhotoUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  className?: string;
}

export default function PhotoUpload({ 
  images, 
  onChange, 
  maxImages = 10, 
  className = '' 
}: PhotoUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;

    const newImages: string[] = [];
    const remainingSlots = maxImages - images.length;

    Array.from(files).slice(0, remainingSlots).forEach((file) => {
      // Проверяем MIME тип или расширение файла для HEIC
      const isValidImageType = file.type.startsWith('image/') || 
        file.name.toLowerCase().endsWith('.heic') || 
        file.name.toLowerCase().endsWith('.heif');
      
      if (isValidImageType) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          if (result) {
            newImages.push(result);
            if (newImages.length === Math.min(files.length, remainingSlots)) {
              onChange([...images, ...newImages]);
            }
          }
        };
        reader.readAsDataURL(file);
      }
    });
  }, [images, onChange, maxImages]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
  };

  return (
    <div className={className}>
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 ${
          isDragOver
            ? 'border-accent bg-accent/10'
            : 'border-white/20 hover:border-white/40'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
      >
        <ImageIcon size={32} className="mx-auto mb-2 opacity-50" />
        <p className="text-sm opacity-70 mb-2">
          Fotos hierher ziehen oder klicken zum Hochladen
        </p>
        <button
          type="button"
          className="btn-secondary text-sm"
          onClick={handleClick}
        >
          <Upload size={16} className="mr-1" />
          Fotos auswählen
        </button>
        <p className="text-xs opacity-50 mt-1">
          Max. {maxImages} Fotos • JPG, PNG, GIF, HEIC
        </p>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.heic,.heif"
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
          {images.map((image, index) => (
            <div key={index} className="relative aspect-square bg-white/5 rounded-lg overflow-hidden group">
              <img 
                src={image} 
                alt={`Upload ${index + 1}`} 
                className="w-full h-full object-cover" 
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
