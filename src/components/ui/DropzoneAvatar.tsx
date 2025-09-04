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
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => onChange(String(reader.result));
    reader.readAsDataURL(file);
  }

  return (
    <div
      className={`fm-dropzone ${drag ? 'dragover' : ''}`}
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
          className="relative overflow-hidden rounded-2xl ring-1 ring-black/10 dark:ring-white/10"
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
          <label className="fm-btn-secondary cursor-pointer">
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
            <button type="button" className="fm-btn-secondary" onClick={onRemove}>
              Entfernen
            </button>
          )}
        </div>
      </div>

      <div className="fm-dropzone__overlay">Bild hierher ziehen</div>
    </div>
  );
}
