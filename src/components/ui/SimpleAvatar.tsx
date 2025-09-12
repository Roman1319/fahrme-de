'use client';

import { useRef, useState } from 'react';
import { getAvatarImage } from '@/lib/storage-helpers';
import { StorageImg } from './StorageImage';

export default function SimpleAvatar({
  value,
  onChange,
  onRemove,
  size = 96,
}: {
  value: string | null;
  onChange: (dataUrl: string) => void;
  onRemove: () => void;
  size?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      console.log('No file selected');
      return;
    }

    console.log('File selected:', file.name, file.type, file.size);
    setLoading(true);

    const reader = new FileReader();
    
    reader.onload = () => {
      console.log('FileReader completed');
      const result = String(reader.result);
      console.log('Data URL length:', result.length);
      onChange(result);
      setLoading(false);
    };

    reader.onerror = () => {
      console.error('FileReader error:', reader.error);
      alert('Error reading file: ' + reader.error);
      setLoading(false);
    };

    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div
          className="relative overflow-hidden rounded-2xl ring-1 ring-black/10 dark:ring-white/10 bg-neutral-100 dark:bg-neutral-800"
          style={{ width: size, height: size }}
        >
          {value ? (
            <StorageImg 
              image={getAvatarImage(value)} 
              className="h-full w-full object-cover" 
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-neutral-500 dark:text-neutral-400">
              {loading ? 'Loading...' : 'No image'}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="btn-secondary cursor-pointer inline-block">
            {loading ? 'Loading...' : 'Select Image'}
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              disabled={loading}
            />
          </label>
          
          {value && (
            <button 
              type="button" 
              className="btn-secondary block" 
              onClick={onRemove}
            >
              Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

