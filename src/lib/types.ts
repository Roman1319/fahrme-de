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
}

export interface Comment {
  id: string;
  text: string;
  author: string;
  timestamp: string;
  likes: number;
  carId: string;
}
