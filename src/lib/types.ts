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
}

export interface LogbookEntry {
  id: string;
  text: string;
  author: string;
  authorEmail: string;
  timestamp: string;
  likes: number;
  carId: string;
  type: 'maintenance' | 'modification' | 'event' | 'general';
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
  userEmail: string;
  likedAt: string;
}
