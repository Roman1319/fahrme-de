'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import { useAuth } from './AuthProvider';

export default function ClientHeader() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Показываем Header всегда с поиском
  return <Header variant="feed" />;
}
