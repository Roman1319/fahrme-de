'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChange } from '@/lib/supabaseClient';
import CarOfTheDay from './CarOfTheDay';

export default function ConditionalCarOfTheDay() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChange((user, ready) => {
      setLoading(!ready);
      setIsAuthenticated(!!user);
    });

    return unsubscribe;
  }, []);

  // Не показывать компонент пока загружается или пользователь не авторизован
  if (loading || !isAuthenticated) {
    return null;
  }

  return <CarOfTheDay />;
}
