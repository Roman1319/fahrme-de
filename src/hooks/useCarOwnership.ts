'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/AuthProvider';

export function useCarOwnership(carId: string | null) {
  const { user } = useAuth();
  const [isOwner, setIsOwner] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!carId || !user) {
      setIsOwner(null);
      return;
    }

    const checkOwnership = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data: car, error: carError } = await supabase
          .from('cars')
          .select('id, owner_id')
          .eq('id', carId)
          .eq('owner_id', user.id)
          .single();

        if (carError) {
          if (carError.code === 'PGRST116') {
            // Car not found or not owned by user
            setIsOwner(false);
          } else {
            console.error('Error checking car ownership:', carError);
            setError('Ошибка проверки принадлежности автомобиля');
            setIsOwner(false);
          }
        } else {
          setIsOwner(!!car);
        }
      } catch (err) {
        console.error('Error in useCarOwnership:', err);
        setError('Ошибка проверки принадлежности автомобиля');
        setIsOwner(false);
      } finally {
        setLoading(false);
      }
    };

    checkOwnership();
  }, [carId, user]);

  return {
    isOwner,
    loading,
    error,
    canCreatePost: isOwner === true
  };
}
