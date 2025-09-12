export interface Car {
  id: string;
  owner_id: string;
  brand: string;
  model: string;
  year: number;
  name?: string;
  color?: string;
  is_main_vehicle: boolean;
  is_former: boolean;
  description?: string;
  story?: string;
  power?: number;
  engine?: string;
  volume?: string;
  gearbox?: string;
  drive?: string;
  created_at: string;
  updated_at: string;
  photos?: CarPhoto[];
}

export interface CarPhoto {
  id: string;
  car_id: string;
  storage_path: string;
  sort: number;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  name?: string | null;
  handle?: string | null;
  avatar_url?: string | null;
  display_name?: string | null;
  about?: string;
  country?: string;
  city?: string;
  gender?: 'male' | 'female' | 'other';
  birth_date?: string; // ISO date string
  created_at: string;
  updated_at: string;
}

// Legacy interface for backward compatibility
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

export interface LogbookEntry {
  id: string;
  car_id: string; // NOT NULL согласно новым RLS политикам
  author_id: string;
  title: string;
  content: string;
  topic?: string;
  allow_comments: boolean;
  publish_date: string;
  created_at: string;
  updated_at: string;
  author: Profile | null;
  // Legacy fields for backward compatibility
  carId?: string;
  authorId?: string;
  publishDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LogbookMedia {
  id: string;
  entry_id: string;
  storage_path: string;
  sort: number;
  created_at: string;
}

export interface Comment {
  id: string;
  entry_id: string;
  author_id: string;
  parent_id?: string;
  text: string;
  created_at: string;
  updated_at: string;
  author: Profile | null;
}

export interface PostLike {
  user_id: string;
  entry_id: string;
  created_at: string;
}

export interface CommentLike {
  user_id: string;
  comment_id: string;
  created_at: string;
}

// Legacy interfaces for backward compatibility
export interface LegacyLogbookEntry {
  id: string;
  userId: string; // Primary identifier for ownership
  carId: string;
  title: string;
  content: string;
  topic: 'repair' | 'tuning' | 'trip' | 'maintenance' | 'event' | 'general';
  photos: string[]; // URLs to photos
  mileage?: number;
  mileageUnit?: 'km' | 'miles';
  cost?: number;
  currency?: 'RUB' | 'UAH' | 'BYN' | 'KZT' | 'USD' | 'EUR';
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
  type: 'repair' | 'tuning' | 'trip' | 'maintenance' | 'event' | 'general';
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