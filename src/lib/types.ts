export interface MyCar {
  id: string;
  name: string;
  make: string;
  model: string;
  year: number;
  color: string;
  images?: string[];
  description?: string;
  story?: string;
  isFormerCar: boolean;
  isMainVehicle?: boolean;
  engine?: string;
  volume?: string;
  gearbox?: string;
  drive?: string;
  power?: number;
  addedDate: string;
  ownerId: string; // ID владельца автомобиля
  ownerAge?: number; // Возраст владельца
  ownerCity?: string; // Город владельца
  previousCar?: string; // Предыдущий автомобиль
}

export interface Comment {
  id: string;
  text: string;
  author: string;
  authorEmail: string;
  timestamp: string;
  likes: number;
  carId: string;
  parentId?: string; // Для вложенных комментариев
  replies?: Comment[]; // Вложенные комментарии
  isEdited?: boolean; // Был ли отредактирован
  editedAt?: string; // Время редактирования
  images?: string[]; // Прикрепленные изображения
}

export interface LogbookEntry {
  id: string;
  userId: string; // Primary identifier for ownership
  carId: string;
  title: string;
  content: string;
  topic: 'service' | 'repair' | 'tuning' | 'trip' | 'other';
  photos: string[]; // URLs to photos
  mileage?: number;
  mileageUnit?: 'km' | 'mi';
  cost?: number;
  currency?: string;
  poll?: {
    question: string;
    options: string[];
    votes?: Record<string, number>; // userId -> optionIndex
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
  mileage?: number;
  mileageUnit?: 'km' | 'miles';
  cost?: number;
  currency?: 'RUB' | 'UAH' | 'BYN' | 'KZT' | 'USD' | 'EUR';
  poll?: {
    question: string;
    options: string[];
  };
  allowComments?: boolean;
  pinToCarPage?: boolean;
  publishDate?: string;
  language?: string;
}

export interface CarInteraction {
  carId: string;
  userEmail: string;
  isFollowing: boolean;
  isLiked: boolean;
  followedAt?: string;
  likedAt?: string;
}

export interface LogbookLike {
  entryId: string;
  userId: string; // Primary identifier
  userEmail?: string; // For backward compatibility
  likedAt: string;
}

export interface LogbookDraft {
  id: string;
  carId: string;
  userId: string;
  title: string;
  text: string;
  type: 'maintenance' | 'repair' | 'tuning' | 'trip' | 'event' | 'general';
  images?: string[];
  mileage?: number;
  mileageUnit?: 'km' | 'miles';
  cost?: number;
  currency?: 'RUB' | 'UAH' | 'BYN' | 'KZT' | 'USD' | 'EUR';
  poll?: {
    question: string;
    options: string[];
  };
  allowComments: boolean;
  pinToCarPage: boolean;
  publishDate: string;
  language: string;
  createdAt: string;
  updatedAt: string;
}