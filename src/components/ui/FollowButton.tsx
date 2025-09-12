'use client';

import { useState } from 'react';
import { Heart, Loader2 } from 'lucide-react';
import { useCarFollow } from '@/hooks/useCarFollow';

interface FollowButtonProps {
  carId: string;
  className?: string;
  showCount?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function FollowButton({ 
  carId, 
  className = '', 
  showCount = true,
  size = 'md'
}: FollowButtonProps) {
  const { isFollowing, followersCount, isLoading, error, toggleFollow } = useCarFollow(carId);
  const [isToggling, setIsToggling] = useState(false);

  const handleToggle = async () => {
    if (isToggling || isLoading) return;
    
    setIsToggling(true);
    try {
      await toggleFollow();
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setIsToggling(false);
    }
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16
  };

  if (error) {
    return (
      <button
        onClick={handleToggle}
        className={`btn-secondary ${sizeClasses[size]} ${className}`}
        title="Ошибка загрузки"
      >
        <span>Ошибка</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading || isToggling}
      className={`
        ${isFollowing ? 'btn-accent' : 'btn-secondary'} 
        ${sizeClasses[size]} 
        ${className}
        flex items-center gap-1.5
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-all duration-200
      `}
      title={isFollowing ? 'Отписаться от машины' : 'Подписаться на машину'}
    >
      {isLoading || isToggling ? (
        <Loader2 size={iconSizes[size]} className="animate-spin" />
      ) : (
        <Heart 
          size={iconSizes[size]} 
          className={isFollowing ? 'fill-current' : ''} 
        />
      )}
      
      <span className="hidden sm:inline">
        {isFollowing ? 'Подписаны' : 'Подписаться'}
      </span>
      
      {showCount && followersCount > 0 && (
        <span className="text-xs opacity-70">
          ({followersCount})
        </span>
      )}
    </button>
  );
}
