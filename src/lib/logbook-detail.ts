// Logbook detail page utilities
import { LogbookEntry, Comment } from './types';
// import { User } from '../services/auth/types'; // TODO: Use User if needed

// Like system for logbook entries
import { STORAGE_KEYS } from './keys';

const LIKES_KEY = STORAGE_KEYS.LOGBOOK_LIKES_KEY;

export function hasUserLikedLogbookEntry(entryId: string, userId: string): boolean {
  try {
    const likes = JSON.parse(localStorage.getItem(LIKES_KEY) || '{}');
    return likes[entryId]?.includes(userId) || false;
  } catch {
    return false;
  }
}

export function toggleLogbookEntryLike(entryId: string, userId: string): boolean {
  try {
    const likes = JSON.parse(localStorage.getItem(LIKES_KEY) || '{}');
    if (!likes[entryId]) {
      likes[entryId] = [];
    }
    
    const userLiked = likes[entryId].includes(userId);
    if (userLiked) {
      likes[entryId] = likes[entryId].filter((id: string) => id !== userId);
    } else {
      likes[entryId].push(userId);
    }
    
    localStorage.setItem(LIKES_KEY, JSON.stringify(likes));
    return !userLiked;
  } catch {
    return false;
  }
}

export function getLogbookEntryLikes(entryId: string): number {
  try {
    const likes = JSON.parse(localStorage.getItem(LIKES_KEY) || '{}');
    return likes[entryId]?.length || 0;
  } catch {
    return 0;
  }
}

// Comment system for logbook entries
export function getComments(entryId: string): Comment[] {
  try {
    const comments = JSON.parse(localStorage.getItem(`${STORAGE_KEYS.LOGBOOK_COMMENTS_PREFIX}${entryId}`) || '[]');
    return comments.filter((comment: Comment) => !(comment as unknown as { deletedAt?: string }).deletedAt);
  } catch {
    return [];
  }
}

export function addComment(entryId: string, comment: Omit<Comment, 'id' | 'createdAt' | 'likes' | 'replies'>): Comment {
  const newComment: Comment = {
    ...comment,
    id: Date.now().toString(),
    created_at: new Date().toISOString(),
    // likes: [], // TODO: Add likes field to Comment type
    // replies: [] // TODO: Add replies field to Comment type
  };
  
  const comments = getComments(entryId);
  comments.push(newComment);
  localStorage.setItem(`${STORAGE_KEYS.LOGBOOK_COMMENTS_PREFIX}${entryId}`, JSON.stringify(comments));
  
  return newComment;
}

export function editComment(entryId: string, commentId: string, newText: string): boolean {
  try {
    const comments = getComments(entryId);
    const comment = comments.find(c => c.id === commentId);
    if (comment) {
      comment.text = newText;
      (comment as unknown as { editedAt?: string }).editedAt = new Date().toISOString();
      localStorage.setItem(`${STORAGE_KEYS.LOGBOOK_COMMENTS_PREFIX}${entryId}`, JSON.stringify(comments));
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function deleteComment(entryId: string, commentId: string): boolean {
  try {
    const comments = getComments(entryId);
    const comment = comments.find(c => c.id === commentId);
    if (comment) {
      (comment as unknown as { deletedAt?: string }).deletedAt = new Date().toISOString();
      localStorage.setItem(`${STORAGE_KEYS.LOGBOOK_COMMENTS_PREFIX}${entryId}`, JSON.stringify(comments));
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function likeComment(entryId: string, commentId: string, userId: string): boolean {
  try {
    const comments = getComments(entryId);
    const comment = comments.find(c => c.id === commentId);
    if (comment) {
      const legacyComment = comment as unknown as { likes?: string[] };
      const userLiked = legacyComment.likes?.includes(userId) || false;
      if (userLiked) {
        legacyComment.likes = legacyComment.likes?.filter((id: string) => id !== userId) || [];
      } else {
        if (!legacyComment.likes) legacyComment.likes = [];
        legacyComment.likes.push(userId);
      }
      localStorage.setItem(`${STORAGE_KEYS.LOGBOOK_COMMENTS_PREFIX}${entryId}`, JSON.stringify(comments));
      return !userLiked;
    }
    return false;
  } catch {
    return false;
  }
}

// Build comment tree structure
export function buildCommentTree(comments: Comment[]): Comment[] {
  const commentMap = new Map<string, Comment & { replies: Comment[] }>();
  const rootComments: (Comment & { replies: Comment[] })[] = [];

  // First pass: create comment nodes
  comments.forEach(comment => {
    commentMap.set(comment.id, { ...comment, replies: [] });
  });

  // Second pass: build tree structure
  comments.forEach(comment => {
    const commentNode = commentMap.get(comment.id)!;
    
    if (comment.parent_id) {
      const parent = commentMap.get(comment.parent_id);
      if (parent) {
        parent.replies.push(commentNode);
      }
    } else {
      rootComments.push(commentNode);
    }
  });

  return rootComments;
}

// Entry utilities
export function getLogbookEntryById(entryId: string): LogbookEntry | null {
  try {
    // Search through all cars' logbooks
    const savedCars = localStorage.getItem('fahrme:my-cars');
    if (!savedCars) return null;

    const cars = JSON.parse(savedCars);
    
    for (const car of cars) {
      const logbookKey = `${STORAGE_KEYS.LOGBOOK_ENTRIES_PREFIX}${car.id}`;
      const entries = JSON.parse(localStorage.getItem(logbookKey) || '[]');
      const entry = entries.find((e: LogbookEntry) => e.id === entryId);
      if (entry) {
        return entry;
      }
    }
    
    return null;
  } catch {
    return null;
  }
}

export function updateLogbookEntry(entryId: string, updates: Partial<LogbookEntry>): boolean {
  try {
    const savedCars = localStorage.getItem('fahrme:my-cars');
    if (!savedCars) return false;

    const cars = JSON.parse(savedCars);
    
    for (const car of cars) {
      const logbookKey = `${STORAGE_KEYS.LOGBOOK_ENTRIES_PREFIX}${car.id}`;
      const entries = JSON.parse(localStorage.getItem(logbookKey) || '[]');
      const entryIndex = entries.findIndex((e: LogbookEntry) => e.id === entryId);
      
      if (entryIndex !== -1) {
        entries[entryIndex] = { ...entries[entryIndex], ...updates };
        localStorage.setItem(logbookKey, JSON.stringify(entries));
        return true;
      }
    }
    
    return false;
  } catch {
    return false;
  }
}

export function deleteLogbookEntry(entryId: string): boolean {
  try {
    const savedCars = localStorage.getItem('fahrme:my-cars');
    if (!savedCars) return false;

    const cars = JSON.parse(savedCars);
    
    for (const car of cars) {
      const logbookKey = `${STORAGE_KEYS.LOGBOOK_ENTRIES_PREFIX}${car.id}`;
      const entries = JSON.parse(localStorage.getItem(logbookKey) || '[]');
      const filteredEntries = entries.filter((e: LogbookEntry) => e.id !== entryId);
      
      if (filteredEntries.length !== entries.length) {
        localStorage.setItem(logbookKey, JSON.stringify(filteredEntries));
        return true;
      }
    }
    
    return false;
  } catch {
    return false;
  }
}

// Check if user is entry owner
export function isEntryOwner(entry: LogbookEntry, userId: string): boolean {
  return entry.author_id === userId;
}
