'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';

export default function ClientHeader() {
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const u = localStorage.getItem('fahrme:user');
      const p = localStorage.getItem('fahrme:profile');
      setIsAuthed(Boolean(u || p));
    } catch {
      setIsAuthed(false);
    }
  }, []);

  // Показываем Header всегда, но аватар только для залогиненных
  return <Header />;
}
