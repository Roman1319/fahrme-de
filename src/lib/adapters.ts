// Адаптеры для преобразования данных между snake_case (база данных) и camelCase (UI)
import { Car, LogbookEntry, Comment, Profile } from './types';

// Адаптеры для Car
export function adaptCarFromDB(car: Car): Car {
  return {
    ...car,
    // Все поля уже в snake_case, просто возвращаем как есть
  };
}

export function adaptCarToDB(car: Partial<Car>): Partial<Car> {
  return {
    ...car,
    // Все поля уже в snake_case, просто возвращаем как есть
  };
}

// Адаптеры для LogbookEntry
export function adaptLogbookEntryFromDB(entry: LogbookEntry): LogbookEntry {
  return {
    ...entry,
    // Все поля уже в snake_case, просто возвращаем как есть
  };
}

export function adaptLogbookEntryToDB(entry: Partial<LogbookEntry>): Partial<LogbookEntry> {
  return {
    ...entry,
    // Все поля уже в snake_case, просто возвращаем как есть
  };
}

// Адаптеры для Comment
export function adaptCommentFromDB(comment: Comment): Comment {
  return {
    ...comment,
    // Все поля уже в snake_case, просто возвращаем как есть
  };
}

export function adaptCommentToDB(comment: Partial<Comment>): Partial<Comment> {
  return {
    ...comment,
    // Все поля уже в snake_case, просто возвращаем как есть
  };
}

// Адаптеры для Profile
export function adaptProfileFromDB(profile: Profile): Profile {
  return {
    ...profile,
    // Все поля уже в snake_case, просто возвращаем как есть
  };
}

export function adaptProfileToDB(profile: Partial<Profile>): Partial<Profile> {
  return {
    ...profile,
    // Все поля уже в snake_case, просто возвращаем как есть
  };
}

// Legacy адаптеры для совместимости со старыми компонентами
// Эти функции преобразуют новые типы в старые форматы для обратной совместимости

export interface LegacyComment {
  id: string;
  text: string;
  author: string;
  authorEmail: string;
  timestamp: string;
  likes: number;
  carId: string;
  parentId?: string;
  replies?: LegacyComment[];
  isEdited?: boolean;
  editedAt?: string;
  images?: string[];
}

export interface LegacyLogbookEntry {
  id: string;
  userId: string;
  carId: string;
  title: string;
  content: string;
  topic: 'repair' | 'tuning' | 'trip' | 'maintenance' | 'event' | 'general';
  photos: string[];
  mileage?: number;
  mileageUnit?: 'km' | 'miles';
  cost?: number;
  currency?: 'RUB' | 'UAH' | 'BYN' | 'KZT' | 'USD' | 'EUR';
  poll?: {
    question: string;
    options: string[];
    votes?: Record<string, number>;
  };
  allowComments: boolean;
  pinOnCar?: boolean;
  language?: string;
  status: 'draft' | 'published';
  createdAt: string;
  updatedAt?: string;
  publishedAt?: string;
  
  // Legacy fields for backward compatibility
  author?: string;
  authorEmail?: string;
  text?: string;
  timestamp?: string;
  likes?: number;
  type?: 'maintenance' | 'modification' | 'event' | 'general';
  images?: string[];
}

// Преобразование Comment в LegacyComment
export function adaptCommentToLegacy(comment: Comment, authorName?: string): LegacyComment {
  return {
    id: comment.id,
    text: comment.text,
    author: authorName || 'Unknown',
    authorEmail: '', // Нет в новом типе, оставляем пустым
    timestamp: comment.created_at,
    likes: 0, // Нет в новом типе, оставляем 0
    carId: '', // Нет в новом типе, оставляем пустым
    parentId: comment.parent_id,
    replies: [], // Нет в новом типе, оставляем пустым
    isEdited: false, // Нет в новом типе, оставляем false
    editedAt: comment.updated_at !== comment.created_at ? comment.updated_at : undefined,
    images: [] // Нет в новом типе, оставляем пустым
  };
}

// Преобразование LogbookEntry в LegacyLogbookEntry
export function adaptLogbookEntryToLegacy(entry: LogbookEntry, authorName?: string): LegacyLogbookEntry {
  return {
    id: entry.id,
    userId: entry.author_id,
    carId: entry.car_id,
    title: entry.title,
    content: entry.content,
    topic: 'general', // Нет в новом типе, используем по умолчанию
    photos: [], // Нет в новом типе, оставляем пустым
    allowComments: entry.allow_comments,
    status: 'published', // Нет в новом типе, используем по умолчанию
    createdAt: entry.created_at,
    updatedAt: entry.updated_at,
    publishedAt: entry.publish_date,
    
    // Legacy fields
    author: authorName,
    authorEmail: '',
    text: entry.content,
    timestamp: entry.publish_date,
    likes: 0,
    type: 'general',
    images: []
  };
}

// Обратные преобразования (из Legacy в новые типы)
export function adaptCommentFromLegacy(comment: LegacyComment): Comment {
  return {
    id: comment.id,
    entry_id: '', // Нет в legacy, оставляем пустым
    author_id: '', // Нет в legacy, оставляем пустым
    parent_id: comment.parentId,
    text: comment.text,
    created_at: comment.timestamp,
    updated_at: comment.editedAt || comment.timestamp
  };
}

export function adaptLogbookEntryFromLegacy(entry: LegacyLogbookEntry): LogbookEntry {
  return {
    id: entry.id,
    car_id: entry.carId,
    author_id: entry.userId,
    title: entry.title,
    content: entry.content,
    allow_comments: entry.allowComments,
    publish_date: entry.publishedAt || entry.createdAt,
    created_at: entry.createdAt,
    updated_at: entry.updatedAt || entry.createdAt
  };
}
