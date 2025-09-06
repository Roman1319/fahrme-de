'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Bold, Italic, Link, Image as ImageIcon, Upload, X } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  images?: string[];
  onImagesChange?: (images: string[]) => void;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Text eingeben...',
  className = '',
  images = [],
  onImagesChange
}: RichTextEditorProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Extract images from text when component mounts or value changes
  React.useEffect(() => {
    if (value && onImagesChange) {
      const imageRegex = /!\[[^\]]*\]\(([^)]+)\)/g;
      const foundImages: string[] = [];
      let match;
      
      while ((match = imageRegex.exec(value)) !== null) {
        if (!foundImages.includes(match[1])) {
          foundImages.push(match[1]);
        }
      }
      
      // Only update if there are new images
      if (foundImages.length > 0 && JSON.stringify(foundImages) !== JSON.stringify(images)) {
        onImagesChange(foundImages);
      }
    }
  }, [value, onImagesChange, images]);

  const insertText = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);
    
    onChange(newText);
    
    // Set cursor position after inserted text
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
    }, 0);
  };

  const insertImage = (imageUrl: string) => {
    const imageMarkdown = `![Bild](${imageUrl})\n`;
    insertText(imageMarkdown);
    
    // Add to images array if not already present
    if (onImagesChange && !images.includes(imageUrl)) {
      onImagesChange([...images, imageUrl]);
    }
  };

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          if (result) {
            // Add to images array if onImagesChange is provided
            if (onImagesChange) {
              onImagesChange([...images, result]);
            }
            // Insert into text
            insertImage(result);
          }
        };
        reader.readAsDataURL(file);
      }
    });
  }, [images, onImagesChange]);

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

  return (
    <div className={className}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 mb-2 p-2 bg-white/5 rounded-lg">
        <button
          type="button"
          onClick={() => insertText('**', '**')}
          className="p-1.5 hover:bg-white/10 rounded transition-colors"
          title="Fett"
        >
          <Bold size={16} />
        </button>
        <button
          type="button"
          onClick={() => insertText('*', '*')}
          className="p-1.5 hover:bg-white/10 rounded transition-colors"
          title="Kursiv"
        >
          <Italic size={16} />
        </button>
        <button
          type="button"
          onClick={() => insertText('[', '](url)')}
          className="p-1.5 hover:bg-white/10 rounded transition-colors"
          title="Link"
        >
          <Link size={16} />
        </button>
        <div className="w-px h-6 bg-white/20 mx-1" />
        <button
          type="button"
          onClick={handleClick}
          className="p-1.5 hover:bg-white/10 rounded transition-colors"
          title="Foto einfügen"
        >
          <ImageIcon size={16} />
        </button>
        <button
          type="button"
          onClick={handleClick}
          className="p-1.5 hover:bg-white/10 rounded transition-colors"
          title="Foto hochladen"
        >
          <Upload size={16} />
        </button>
      </div>

      {/* Text Editor */}
      <div
        className={`relative ${
          isDragOver ? 'ring-2 ring-accent ring-opacity-50' : ''
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="form-input min-h-[200px] resize-y w-full"
        />
        
        {/* Drag overlay */}
        {isDragOver && (
          <div className="absolute inset-0 bg-accent/10 border-2 border-dashed border-accent rounded-lg flex items-center justify-center">
            <div className="text-center">
              <ImageIcon size={32} className="mx-auto mb-2 text-accent" />
              <p className="text-accent font-medium">Fotos hier ablegen</p>
            </div>
          </div>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />

      {/* Image Gallery */}
      {images.length > 0 && (
        <div className="mt-3">
          <p className="text-sm font-medium mb-2">Hochgeladene Fotos:</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {images.map((image, index) => (
              <div key={index} className="relative aspect-square bg-white/5 rounded-lg overflow-hidden group">
                <img 
                  src={image} 
                  alt={`Upload ${index + 1}`} 
                  className="w-full h-full object-cover" 
                />
                <button
                  type="button"
                  onClick={() => {
                    if (onImagesChange) {
                      onImagesChange(images.filter((_, i) => i !== index));
                    }
                  }}
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => insertImage(image)}
                  className="absolute bottom-1 left-1 px-2 py-1 bg-accent text-black text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Einfügen
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
