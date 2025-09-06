'use client';

import React from 'react';
import { Heart } from 'lucide-react';
import { useLikes, LikeTargetType } from '@/lib/likes';
import { useAuth } from '@/components/AuthProvider';

interface LikeButtonProps {
  targetType: LikeTargetType;
  targetId: string;
  className?: string;
  showCount?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'minimal' | 'outline';
  onLikeChange?: (liked: boolean, count: number) => void;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5', 
  lg: 'w-6 h-6'
};

const buttonSizeClasses = {
  sm: 'p-1.5',
  md: 'p-2',
  lg: 'p-2.5'
};

export default function LikeButton({
  targetType,
  targetId,
  className = '',
  showCount = true,
  size = 'md',
  variant = 'default',
  onLikeChange
}: LikeButtonProps) {
  const { user } = useAuth();
  const { liked, likeCount, isLoading, toggle } = useLikes(
    user?.id || '',
    targetType,
    targetId
  );

  // Notify parent component of changes
  React.useEffect(() => {
    onLikeChange?.(liked, likeCount);
  }, [liked, likeCount, onLikeChange]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggle();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      toggle();
    }
  };

  const baseClasses = `
    inline-flex items-center gap-1.5 rounded-full transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500
    disabled:opacity-50 disabled:cursor-not-allowed
    ${buttonSizeClasses[size]}
  `;

  const variantClasses = {
    default: `
      ${liked 
        ? 'bg-red-500 text-white hover:bg-red-600 dark:bg-red-500 dark:text-white dark:hover:bg-red-600' 
        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
      }
    `,
    minimal: `
      ${liked 
        ? 'text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20' 
        : 'text-gray-500 hover:text-red-500 hover:bg-red-50 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-900/20'
      }
    `,
    outline: `
      border-2 ${liked 
        ? 'border-red-500 text-red-500 hover:bg-red-50 dark:border-red-400 dark:text-red-400 dark:hover:bg-red-900/20' 
        : 'border-gray-300 text-gray-600 hover:border-red-500 hover:text-red-500 dark:border-gray-600 dark:text-gray-400 dark:hover:border-red-400 dark:hover:text-red-400'
      }
    `
  };

  const iconClasses = `
    ${sizeClasses[size]} transition-transform duration-200
    ${liked ? 'scale-110' : 'scale-100'}
    ${isLoading ? 'animate-pulse' : ''}
  `;

  const countClasses = `
    text-sm font-medium transition-colors duration-200
    ${liked 
      ? 'text-white dark:text-white' 
      : 'text-gray-600 dark:text-gray-400'
    }
  `;

  return (
    <button
      type="button"
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={isLoading}
      aria-pressed={liked}
      aria-label={liked ? 'Like entfernen' : 'Like hinzufügen'}
      title={liked ? 'Like entfernen' : 'Like hinzufügen'}
    >
      <Heart 
        className={`${iconClasses} ${liked ? 'fill-current' : ''}`}
        aria-hidden="true"
      />
      {showCount && (
        <span className={countClasses}>
          {likeCount}
        </span>
      )}
    </button>
  );
}

// Compact version for tight spaces
export function LikeButtonCompact({
  targetType,
  targetId,
  className = '',
  onLikeChange
}: Omit<LikeButtonProps, 'showCount' | 'size' | 'variant'>) {
  return (
    <LikeButton
      targetType={targetType}
      targetId={targetId}
      className={className}
      showCount={false}
      size="sm"
      variant="minimal"
      onLikeChange={onLikeChange}
    />
  );
}

// Large version for prominent display
export function LikeButtonLarge({
  targetType,
  targetId,
  className = '',
  onLikeChange
}: Omit<LikeButtonProps, 'showCount' | 'size' | 'variant'>) {
  return (
    <LikeButton
      targetType={targetType}
      targetId={targetId}
      className={className}
      showCount={true}
      size="lg"
      variant="default"
      onLikeChange={onLikeChange}
    />
  );
}
