// Утилиты для управления взаимодействиями пользователей с автомобилями

import { CarInteraction, LogbookLike, Comment, LogbookEntry } from './types';

const INTERACTIONS_KEY = 'fahrme:interactions';
const LOGBOOK_LIKES_KEY = 'fahrme:logbook-likes';

// === Управление подписками и лайками автомобилей ===

export function getCarInteraction(carId: string, userEmail: string): CarInteraction | null {
  const interactions = getInteractions();
  return interactions.find(i => i.carId === carId && i.userEmail === userEmail) || null;
}

export function toggleCarFollow(carId: string, userEmail: string): boolean {
  const interactions = getInteractions();
  const existing = interactions.find(i => i.carId === carId && i.userEmail === userEmail);
  
  if (existing) {
    existing.isFollowing = !existing.isFollowing;
    existing.followedAt = existing.isFollowing ? new Date().toISOString() : undefined;
  } else {
    interactions.push({
      carId,
      userEmail,
      isFollowing: true,
      isLiked: false,
      followedAt: new Date().toISOString()
    });
  }
  
  saveInteractions(interactions);
  return existing ? existing.isFollowing : true;
}

export function toggleCarLike(carId: string, userEmail: string): boolean {
  const interactions = getInteractions();
  const existing = interactions.find(i => i.carId === carId && i.userEmail === userEmail);
  
  if (existing) {
    existing.isLiked = !existing.isLiked;
    existing.likedAt = existing.isLiked ? new Date().toISOString() : undefined;
  } else {
    interactions.push({
      carId,
      userEmail,
      isFollowing: false,
      isLiked: true,
      likedAt: new Date().toISOString()
    });
  }
  
  saveInteractions(interactions);
  return existing ? existing.isLiked : true;
}

export function getCarStats(carId: string): { followers: number; likes: number } {
  const interactions = getInteractions();
  const carInteractions = interactions.filter(i => i.carId === carId);
  
  return {
    followers: carInteractions.filter(i => i.isFollowing).length,
    likes: carInteractions.filter(i => i.isLiked).length
  };
}

// === Управление лайками записей бортового журнала ===

export function toggleLogbookEntryLike(entryId: string, userEmail: string): boolean {
  const likes = getLogbookLikes();
  const existingLike = likes.find(l => l.entryId === entryId && l.userEmail === userEmail);
  
  if (existingLike) {
    // Убираем лайк
    const updatedLikes = likes.filter(l => !(l.entryId === entryId && l.userEmail === userEmail));
    saveLogbookLikes(updatedLikes);
    return false;
  } else {
    // Добавляем лайк
    likes.push({
      entryId,
      userEmail,
      likedAt: new Date().toISOString()
    });
    saveLogbookLikes(likes);
    return true;
  }
}

export function getLogbookEntryLikes(entryId: string): number {
  const likes = getLogbookLikes();
  return likes.filter(l => l.entryId === entryId).length;
}

export function hasUserLikedLogbookEntry(entryId: string, userEmail: string): boolean {
  const likes = getLogbookLikes();
  return likes.some(l => l.entryId === entryId && l.userEmail === userEmail);
}

// === Управление комментариями ===

export function addComment(carId: string, text: string, author: string, authorEmail: string, parentId?: string, images?: string[]): Comment {
  const comment: Comment = {
    id: Date.now().toString(),
    text,
    author,
    authorEmail,
    timestamp: new Date().toLocaleString('de-DE'),
    likes: 0,
    carId,
    parentId,
    images: images || []
  };
  
  
  const comments = getComments(carId);
  comments.push(comment);
  saveComments(carId, comments);
  
  return comment;
}

export function getComments(carId: string): Comment[] {
  const savedComments = localStorage.getItem(`fahrme:comments:${carId}`);
  if (savedComments) {
    try {
      const comments = JSON.parse(savedComments);
      
      // Миграция: добавляем поле images для старых комментариев
      const migratedComments = comments.map((comment: any) => ({
        ...comment,
        images: comment.images || []
      }));
      
      return migratedComments;
    } catch (error) {
      console.error('Error loading comments:', error);
      return [];
    }
  }
  return [];
}

export function saveComments(carId: string, comments: Comment[]): void {
  localStorage.setItem(`fahrme:comments:${carId}`, JSON.stringify(comments));
}

export function editComment(carId: string, commentId: string, text: string): boolean {
  const comments = getComments(carId);
  const comment = comments.find(c => c.id === commentId);
  
  if (comment) {
    comment.text = text;
    comment.isEdited = true;
    comment.editedAt = new Date().toLocaleString('de-DE');
    saveComments(carId, comments);
    return true;
  }
  
  return false;
}

export function deleteComment(carId: string, commentId: string): boolean {
  const comments = getComments(carId);
  const filteredComments = comments.filter(c => c.id !== commentId);
  
  if (filteredComments.length < comments.length) {
    saveComments(carId, filteredComments);
    return true;
  }
  
  return false;
}

export function likeComment(carId: string, commentId: string, userEmail: string): boolean {
  const comments = getComments(carId);
  const comment = comments.find(c => c.id === commentId);
  
  if (comment) {
    // Простая логика лайков - в реальном приложении нужно хранить отдельно
    comment.likes += 1;
    saveComments(carId, comments);
    return true;
  }
  
  return false;
}

// === Управление записями бортового журнала ===

export function addLogbookEntry(
  carId: string, 
  text: string, 
  author: string, 
  authorEmail: string, 
  type: LogbookEntry['type'] = 'general'
): LogbookEntry {
  const entry: LogbookEntry = {
    id: Date.now().toString(),
    text,
    author,
    authorEmail,
    timestamp: new Date().toLocaleString('de-DE'),
    likes: 0,
    carId,
    type
  };
  
  const entries = getLogbookEntries(carId);
  entries.push(entry);
  saveLogbookEntries(carId, entries);
  
  return entry;
}

export function getLogbookEntries(carId: string): LogbookEntry[] {
  const savedEntries = localStorage.getItem(`fahrme:logbook:${carId}`);
  if (savedEntries) {
    try {
      return JSON.parse(savedEntries);
    } catch (error) {
      console.error('Error loading logbook entries:', error);
      return [];
    }
  }
  return [];
}

export function saveLogbookEntries(carId: string, entries: LogbookEntry[]): void {
  localStorage.setItem(`fahrme:logbook:${carId}`, JSON.stringify(entries));
}

// === Вспомогательные функции ===

function getInteractions(): CarInteraction[] {
  const saved = localStorage.getItem(INTERACTIONS_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (error) {
      console.error('Error loading interactions:', error);
      return [];
    }
  }
  return [];
}

function saveInteractions(interactions: CarInteraction[]): void {
  localStorage.setItem(INTERACTIONS_KEY, JSON.stringify(interactions));
}

function getLogbookLikes(): LogbookLike[] {
  const saved = localStorage.getItem(LOGBOOK_LIKES_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (error) {
      console.error('Error loading logbook likes:', error);
      return [];
    }
  }
  return [];
}

function saveLogbookLikes(likes: LogbookLike[]): void {
  localStorage.setItem(LOGBOOK_LIKES_KEY, JSON.stringify(likes));
}
