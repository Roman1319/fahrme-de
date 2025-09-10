'use client';

import { useState } from 'react';
// Removed server imports - using API calls instead
import { CarPhoto } from '@/lib/types';
import { useAuth } from '@/components/AuthProvider';

export function CarPhotoUploader({ carId, onAdded }: { carId: string; onAdded?: (photo: CarPhoto)=>void }) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    setBusy(true); setErr(null);
    
    // Upload photo via API
    const formData = new FormData();
    formData.append('file', file);
    formData.append('carId', carId);
    formData.append('userId', user.id);
    
    fetch('/api/cars/photos', {
      method: 'POST',
      body: formData,
    })
      .then(response => response.json())
      .then(row => {
        onAdded?.(row);
      })
      .catch((e: unknown) => {
        console.error('Upload error:', e);
        setErr((e as Error)?.message ?? 'Upload failed');
      })
      .finally(() => {
        setBusy(false);
        e.target.value = '';
      });
  }

  return (
    <div className="flex items-center gap-3">
      <label className="px-3 py-2 rounded-xl border cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900">
        {busy ? 'Загрузка…' : 'Добавить фото'}
        <input type="file" accept="image/*" className="hidden" onChange={onChange} disabled={busy || !user}/>
      </label>
      {err && <span className="text-sm text-red-500">{err}</span>}
    </div>
  );
}
