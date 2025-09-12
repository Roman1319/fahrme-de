import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';

interface CarFollowState {
  isFollowing: boolean;
  followersCount: number;
  isLoading: boolean;
  error: string | null;
}

export function useCarFollow(carId: string) {
  const { user } = useAuth();
  const [state, setState] = useState<CarFollowState>({
    isFollowing: false,
    followersCount: 0,
    isLoading: true,
    error: null
  });

  const loadFollowStatus = async () => {
    if (!user || !carId) {
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Загрузить статус подписки и статистику параллельно
      const [followResponse, statsResponse] = await Promise.all([
        fetch(`/api/cars/${carId}/follow`),
        fetch(`/api/cars/${carId}/stats`)
      ]);

      if (!followResponse.ok || !statsResponse.ok) {
        throw new Error('Failed to load follow status');
      }

      const followData = await followResponse.json();
      const statsData = await statsResponse.json();

      setState(prev => ({
        ...prev,
        isFollowing: followData.isFollowing,
        followersCount: statsData.followersCount,
        isLoading: false,
        error: null
      }));
    } catch (error) {
      console.error('Error loading follow status:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  };

  const toggleFollow = async () => {
    if (!user || !carId) return;

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const method = state.isFollowing ? 'DELETE' : 'POST';
      const response = await fetch(`/api/cars/${carId}/follow`, {
        method,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to toggle follow');
      }

      // Обновить локальное состояние
      setState(prev => ({
        ...prev,
        isFollowing: !prev.isFollowing,
        followersCount: prev.isFollowing 
          ? Math.max(0, prev.followersCount - 1)
          : prev.followersCount + 1,
        isLoading: false,
        error: null
      }));
    } catch (error) {
      console.error('Error toggling follow:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  };

  useEffect(() => {
    loadFollowStatus();
  }, [carId, user]);

  return {
    ...state,
    toggleFollow,
    refetch: loadFollowStatus
  };
}
