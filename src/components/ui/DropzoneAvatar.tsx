'use client';

import { useRef, useState } from 'react';

export default function DropzoneAvatar({
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
  const [drag, setDrag] = useState(false);

  function readFile(file: File) {
    if (!file.type.startsWith('image/')) {
      alert('Bitte wählen Sie eine gültige Bilddatei aus.');
      return;
    }
    
    // Проверяем размер файла (максимум 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Die Bilddatei ist zu groß. Maximale Größe: 5MB');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result);
      // Проверяем минимальный размер изображения
      const img = new Image();
      img.onload = () => {
        if (img.width < 200 || img.height < 200) {
          alert('Das Bild ist zu klein. Minimale Größe: 200x200 Pixel');
          return;
        }
        onChange(result);
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  }

  return (
    <div
      className={`fm-dropzone ${drag ? 'dragover' : ''} relative`}
      style={{ width: size * 2.5, padding: 12 }}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault(); setDrag(false);
        const f = e.dataTransfer.files?.[0]; if (f) readFile(f);
      }}
    >
      <div className="flex items-center gap-4">
        <div
          className="relative overflow-hidden rounded-2xl ring-1 ring-black/10 dark:ring-white/10 bg-neutral-100 dark:bg-neutral-800"
          style={{ width: size, height: size }}
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="Avatar" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-neutral-500 dark:text-neutral-400">
              kein Bild
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <label className="btn-secondary cursor-pointer">
            Bild auswählen
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) readFile(f);
              }}
            />
          </label>
          {value && (
            <button type="button" className="btn-secondary" onClick={onRemove}>
              Entfernen
            </button>
          )}
        </div>
      </div>

      <div className="fm-dropzone__overlay">Bild hierher ziehen</div>
    </div>
  );
}
