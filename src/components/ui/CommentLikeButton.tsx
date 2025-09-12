'use client';

import { useState } from 'react';
import { Heart } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

interface CommentLikeButtonProps {
  commentId: string;
  initialLiked: boolean;
  initialCount: number;
  onLikeChange?: (liked: boolean, count: number) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function CommentLikeButton({
  commentId,
  initialLiked,
  initialCount,
  onLikeChange,
  className = '',
  size = 'sm'
}: CommentLikeButtonProps) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  const handleLike = async () => {
    if (!user || loading) return;

    setLoading(true);
    
    // Optimistic update
    const newLiked = !liked;
    const newCount = newLiked ? count + 1 : count - 1;
    
    setLiked(newLiked);
    setCount(newCount);
    onLikeChange?.(newLiked, newCount);

    try {
      const method = newLiked ? 'POST' : 'DELETE';
      const response = await fetch(`/api/comments/${commentId}/like`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // Revert on error
        setLiked(!newLiked);
        setCount(newLiked ? count - 1 : count + 1);
        onLikeChange?.(!newLiked, newLiked ? count - 1 : count + 1);
        
        const error = await response.json();
        console.error('Comment like error:', error);
        return;
      }

      const data = await response.json();
      console.log('Comment like success:', data);
    } catch (error) {
      // Revert on error
      setLiked(!newLiked);
      setCount(newLiked ? count - 1 : count + 1);
      onLikeChange?.(!newLiked, newLiked ? count - 1 : count + 1);
      
      console.error('Comment like error:', error);
    } finally {
      setLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <button
      onClick={handleLike}
      disabled={!user || loading}
      className={`flex items-center gap-1 transition-colors ${
        liked ? 'text-accent' : 'text-white/70 hover:text-accent'
      } ${className}`}
    >
      <Heart 
        size={size === 'sm' ? 12 : size === 'md' ? 16 : 20}
        className={`${sizeClasses[size]} ${liked ? 'fill-current' : ''} ${
          loading ? 'animate-pulse' : ''
        }`}
      />
      <span className={`${textSizeClasses[size]} font-medium`}>
        {count}
      </span>
    </button>
  );
}
