// Like-System für fahrme.de
// Frontend-only Implementation mit localStorage und in-memory Fallback

import { STORAGE_KEYS } from './keys';

export type LikeTargetType = 'POST' | 'COMMENT' | 'CAR' | 'ALBUM';

export interface LikeStatus {
  liked: boolean;
  likeCount: number;
}

export interface LikeKey {
  userId: string;
  targetType: LikeTargetType;
  targetId: string;
}

// Rate limiting: max 30 likes per minute per user
const RATE_LIMIT_LIKES_PER_MINUTE = 30;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

class LikeService {
  private memoryStorage: Set<string> = new Set();
  private memoryCounters: Map<string, number> = new Map();
  private rateLimitMap: Map<string, number[]> = new Map();
  private useMemoryStorage = false;

  constructor() {
    this.checkStorageAvailability();
  }

  private checkStorageAvailability() {
    try {
      const testKey = 'fahrme:likes:test';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      this.useMemoryStorage = false;
    } catch (error) {
      console.warn('localStorage not available, using memory storage:', error);
      this.useMemoryStorage = true;
    }
  }

  private getStorageKey(likeKey: LikeKey): string {
    return `${likeKey.userId}:${likeKey.targetType}:${likeKey.targetId}`;
  }

  private getCounterKey(targetType: LikeTargetType, targetId: string): string {
    return `${targetType}:${targetId}`;
  }

  private isRateLimited(userId: string): boolean {
    if (this.useMemoryStorage) return false; // Skip rate limiting in memory mode
    
    const now = Date.now();
    const userLikes = this.rateLimitMap.get(userId) || [];
    
    // Remove old entries outside the window
    const recentLikes = userLikes.filter(time => now - time < RATE_LIMIT_WINDOW_MS);
    
    if (recentLikes.length >= RATE_LIMIT_LIKES_PER_MINUTE) {
      return true;
    }
    
    // Add current like and update
    recentLikes.push(now);
    this.rateLimitMap.set(userId, recentLikes);
    
    return false;
  }

  private getLikesSet(): Set<string> {
    if (this.useMemoryStorage) {
      return this.memoryStorage;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.LIKES_SET_KEY);
      if (stored) {
        const likes = JSON.parse(stored);
        return new Set(likes);
      }
      return new Set();
    } catch (error) {
      console.warn('Error reading likes from localStorage, using memory storage:', error);
      this.useMemoryStorage = true;
      return this.memoryStorage;
    }
  }

  private saveLikesSet(likes: Set<string>): void {
    if (this.useMemoryStorage) {
      this.memoryStorage = likes;
      return;
    }

    try {
      localStorage.setItem(STORAGE_KEYS.LIKES_SET_KEY, JSON.stringify([...likes]));
    } catch (error) {
      console.warn('Error saving likes to localStorage, using memory storage:', error);
      this.useMemoryStorage = true;
      this.memoryStorage = likes;
    }
  }

  private getCounters(): Map<string, number> {
    if (this.useMemoryStorage) {
      return this.memoryCounters;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.LIKES_COUNTERS_KEY);
      if (stored) {
        const counters = JSON.parse(stored);
        return new Map(Object.entries(counters));
      }
      return new Map();
    } catch (error) {
      console.warn('Error reading counters from localStorage, using memory storage:', error);
      this.useMemoryStorage = true;
      return this.memoryCounters;
    }
  }

  private saveCounters(counters: Map<string, number>): void {
    if (this.useMemoryStorage) {
      this.memoryCounters = counters;
      return;
    }

    try {
      const obj = Object.fromEntries(counters);
      localStorage.setItem(STORAGE_KEYS.LIKES_COUNTERS_KEY, JSON.stringify(obj));
    } catch (error) {
      console.warn('Error saving counters to localStorage, using memory storage:', error);
      this.useMemoryStorage = true;
      this.memoryCounters = counters;
    }
  }

  private notifyStorageChange(): void {
    if (!this.useMemoryStorage) {
      // Dispatch storage event for cross-tab synchronization
      window.dispatchEvent(new StorageEvent('storage', {
        key: STORAGE_KEYS.LIKES_SET_KEY,
        newValue: localStorage.getItem(STORAGE_KEYS.LIKES_SET_KEY),
        oldValue: localStorage.getItem(STORAGE_KEYS.LIKES_SET_KEY),
        storageArea: localStorage,
        url: window.location.href
      }));
    }
  }

  // Public API
  getStatus(userId: string, targetType: LikeTargetType, targetId: string): LikeStatus {
    const likeKey: LikeKey = { userId, targetType, targetId };
    const storageKey = this.getStorageKey(likeKey);
    const counterKey = this.getCounterKey(targetType, targetId);
    
    const likes = this.getLikesSet();
    const counters = this.getCounters();
    
    const liked = likes.has(storageKey);
    const likeCount = Math.max(0, counters.get(counterKey) || 0);
    
    return { liked, likeCount };
  }

  like(userId: string, targetType: LikeTargetType, targetId: string): LikeStatus {
    // Check rate limiting
    if (this.isRateLimited(userId)) {
      console.warn('Rate limit exceeded for user:', userId);
      return this.getStatus(userId, targetType, targetId);
    }

    const likeKey: LikeKey = { userId, targetType, targetId };
    const storageKey = this.getStorageKey(likeKey);
    const counterKey = this.getCounterKey(targetType, targetId);
    
    const likes = this.getLikesSet();
    const counters = this.getCounters();
    
    // If already liked, return current status (idempotent)
    if (likes.has(storageKey)) {
      return this.getStatus(userId, targetType, targetId);
    }
    
    // Add like
    likes.add(storageKey);
    this.saveLikesSet(likes);
    
    // Update counter
    const currentCount = Math.max(0, counters.get(counterKey) || 0);
    counters.set(counterKey, currentCount + 1);
    this.saveCounters(counters);
    
    this.notifyStorageChange();
    
    return { liked: true, likeCount: currentCount + 1 };
  }

  unlike(userId: string, targetType: LikeTargetType, targetId: string): LikeStatus {
    const likeKey: LikeKey = { userId, targetType, targetId };
    const storageKey = this.getStorageKey(likeKey);
    const counterKey = this.getCounterKey(targetType, targetId);
    
    const likes = this.getLikesSet();
    const counters = this.getCounters();
    
    // If not liked, return current status (idempotent)
    if (!likes.has(storageKey)) {
      return this.getStatus(userId, targetType, targetId);
    }
    
    // Remove like
    likes.delete(storageKey);
    this.saveLikesSet(likes);
    
    // Update counter (never go below 0)
    const currentCount = Math.max(0, counters.get(counterKey) || 0);
    const newCount = Math.max(0, currentCount - 1);
    counters.set(counterKey, newCount);
    this.saveCounters(counters);
    
    this.notifyStorageChange();
    
    return { liked: false, likeCount: newCount };
  }

  toggle(userId: string, targetType: LikeTargetType, targetId: string): LikeStatus {
    const currentStatus = this.getStatus(userId, targetType, targetId);
    
    if (currentStatus.liked) {
      return this.unlike(userId, targetType, targetId);
    } else {
      return this.like(userId, targetType, targetId);
    }
  }

  // Initialize counters from mock data (optional)
  initializeCounters(targetType: LikeTargetType, targetId: string, initialCount: number): void {
    const counterKey = this.getCounterKey(targetType, targetId);
    const counters = this.getCounters();
    
    // Only set if not already present
    if (!counters.has(counterKey)) {
      counters.set(counterKey, Math.max(0, initialCount));
      this.saveCounters(counters);
    }
  }

  // Get all likes for a user (for debugging/admin purposes)
  getUserLikes(userId: string): LikeKey[] {
    const likes = this.getLikesSet();
    const userLikes: LikeKey[] = [];
    
    for (const key of likes) {
      if (key.startsWith(`${userId}:`)) {
        const parts = key.split(':');
        if (parts.length === 3) {
          userLikes.push({
            userId: parts[0],
            targetType: parts[1] as LikeTargetType,
            targetId: parts[2]
          });
        }
      }
    }
    
    return userLikes;
  }

  // Clear all data (for testing)
  clearAllData(): void {
    if (this.useMemoryStorage) {
      this.memoryStorage.clear();
      this.memoryCounters.clear();
    } else {
      try {
        localStorage.removeItem(STORAGE_KEYS.LIKES_SET_KEY);
        localStorage.removeItem(STORAGE_KEYS.LIKES_COUNTERS_KEY);
      } catch (error) {
        console.warn('Error clearing localStorage:', error);
      }
    }
    this.rateLimitMap.clear();
  }
}

// Singleton instance
export const likeService = new LikeService();

// Hook for React components
export function useLikes(userId: string | null, targetType: LikeTargetType, targetId: string) {
  const [status, setStatus] = React.useState<LikeStatus>({ liked: false, likeCount: 0 });
  const [isLoading, setIsLoading] = React.useState(false);

  // Load initial status
  React.useEffect(() => {
    if (userId) {
      const initialStatus = likeService.getStatus(userId, targetType, targetId);
      setStatus(initialStatus);
    } else {
      setStatus({ liked: false, likeCount: 0 });
    }
  }, [userId, targetType, targetId]);

  // Listen for storage changes (cross-tab sync)
  React.useEffect(() => {
    const handleStorageChange = () => {
      if (userId) {
        const newStatus = likeService.getStatus(userId, targetType, targetId);
        setStatus(newStatus);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [userId, targetType, targetId]);

  const handleToggle = React.useCallback(async () => {
    if (!userId) {
      // Show login modal or notification
      alert('Bitte melden Sie sich an, um zu liken');
      return;
    }

    if (isLoading) return; // Prevent double-clicks

    setIsLoading(true);
    
    try {
      // Optimistic update
      const optimisticStatus = status.liked 
        ? { liked: false, likeCount: Math.max(0, status.likeCount - 1) }
        : { liked: true, likeCount: status.likeCount + 1 };
      
      setStatus(optimisticStatus);
      
      // Perform actual toggle
      const newStatus = likeService.toggle(userId, targetType, targetId);
      setStatus(newStatus);
      
    } catch (error) {
      console.error('Error toggling like:', error);
      // Revert optimistic update
      const revertedStatus = likeService.getStatus(userId, targetType, targetId);
      setStatus(revertedStatus);
    } finally {
      setIsLoading(false);
    }
  }, [userId, targetType, targetId, status, isLoading]);

  return {
    ...status,
    isLoading,
    toggle: handleToggle
  };
}

// Import React for the hook
import React from 'react';
