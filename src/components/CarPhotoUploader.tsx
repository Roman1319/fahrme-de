'use client';

import { useState } from 'react';
import { uploadCarPhoto } from '@/lib/storage';
import { addCarPhoto } from '@/lib/cars';
import { useAuth } from '@/components/AuthProvider';

export function CarPhotoUploader({ carId, onAdded }: { carId: string; onAdded?: (photo: any)=>void }) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    setBusy(true); setErr(null);
    try {
      const { storagePath, publicUrl } = await uploadCarPhoto(file, carId, user.id);
      const row = await addCarPhoto({ carId, userId: user.id, url: publicUrl, storagePath, isCover: false });
      onAdded?.(row);
    } catch (e: any) {
      console.error('Upload error:', e);
      setErr(e?.message ?? 'Upload failed');
    } finally {
      setBusy(false);
      e.target.value = '';
    }
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
