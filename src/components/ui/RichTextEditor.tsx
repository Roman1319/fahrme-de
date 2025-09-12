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
  const [dragPosition, setDragPosition] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Extract images from text when component mounts or value changes
  React.useEffect(() => {
    if (value && onImagesChange) {
      // Look for image references like ![foto1], ![foto2], etc.
      const imageRegex = /!\[foto(\d+)\]/g;
      const foundReferences: string[] = [];
      let match;
      
      while ((match = imageRegex.exec(value)) !== null) {
        const reference = `foto${match[1]}`;
        if (!foundReferences.includes(reference)) {
          foundReferences.push(reference);
        }
      }
      
      // Map references to actual image URLs from the images array
      const foundImages: string[] = [];
      foundReferences.forEach((ref, index) => {
        if (images[index]) {
          foundImages.push(images[index]);
        }
      });
      
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

  const insertImage = (imageUrl: string, position?: number) => {
    // Generate a simple reference like "foto1", "foto2", etc.
    const imageIndex = images.length + 1;
    const imageReference = `foto${imageIndex}`;
    // Only insert the reference, not the full base64 URL
    const imageMarkdown = `![${imageReference}]\n`;
    
    if (position !== undefined) {
      // Insert at specific position
      const newText = value.substring(0, position) + imageMarkdown + value.substring(position);
      onChange(newText);
      
      // Set cursor position after inserted image
      setTimeout(() => {
        const textarea = textareaRef.current;
        if (textarea) {
          textarea.focus();
          textarea.setSelectionRange(position + imageMarkdown.length, position + imageMarkdown.length);
        }
      }, 0);
    } else {
      // Use normal insertText behavior
      insertText(imageMarkdown);
    }
    
    // Add to images array if not already present
    if (onImagesChange && !images.includes(imageUrl)) {
      onImagesChange([...images, imageUrl]);
    }
  };

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;

    Array.from(files).forEach((file) => {
      // Проверяем MIME тип или расширение файла для HEIC
      const isValidImageType = file.type.startsWith('image/') || 
        file.name.toLowerCase().endsWith('.heic') || 
        file.name.toLowerCase().endsWith('.heif');
      
      if (isValidImageType) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          if (result) {
            // Add to images array if onImagesChange is provided
            if (onImagesChange) {
              onImagesChange([...images, result]);
            }
            // Insert into text at drag position or current cursor position
            const position = dragPosition !== null ? dragPosition : textareaRef.current?.selectionStart || 0;
            insertImage(result, position);
            setDragPosition(null); // Reset drag position
          }
        };
        reader.readAsDataURL(file);
      }
    });
  }, [images, onImagesChange, dragPosition]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    // Get cursor position at drop point
    const textarea = textareaRef.current;
    if (textarea) {
      const rect = textarea.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Calculate approximate cursor position based on drop coordinates
      const lineHeight = 20; // Approximate line height
      const charWidth = 8; // Approximate character width
      const lines = Math.floor(y / lineHeight);
      const chars = Math.floor(x / charWidth);
      
      // Get current text lines
      const textLines = value.split('\n');
      let position = 0;
      
      for (let i = 0; i < Math.min(lines, textLines.length); i++) {
        position += textLines[i].length + 1; // +1 for newline
      }
      
      position += Math.min(chars, textLines[Math.min(lines, textLines.length - 1)]?.length || 0);
      setDragPosition(position);
    }
    
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect, value]);

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
              <p className="text-accent/70 text-sm mt-1">Bild wird an der Cursor-Position eingefügt</p>
            </div>
          </div>
        )}
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

      {/* Image Gallery */}
      {images.length > 0 && (
        <div className="mt-3">
          <p className="text-sm font-medium mb-2">Hochgeladene Fotos:</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {images.map((image, index) => (
              <div key={index} className="relative aspect-square bg-white/5 rounded-lg overflow-hidden group">
                <img 
                  src={image} 
                  alt={`foto${index + 1}`} 
                  className="w-full h-full object-cover" 
                />
                <div className="absolute top-1 left-1 px-2 py-1 bg-black/50 text-white text-xs rounded">
                  foto{index + 1}
                </div>
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
                  onClick={() => {
                    const position = textareaRef.current?.selectionStart || 0;
                    insertImage(image, position);
                  }}
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
