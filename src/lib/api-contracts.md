# API Contracts

This file defines the contract for future backend API migration. These types are not used in runtime but serve as a contract for the backend implementation.

## Authentication

### POST /auth/login
```typescript
Request: {
  email: string;
  password: string;
}

Response: {
  user: {
    id: string;
    name: string;
    email: string;
    role: 'viewer' | 'user' | 'admin';
    createdAt: string;
  };
  session: {
    token: string;
    expiresAt: string;
  };
}
```

### POST /auth/register
```typescript
Request: {
  name: string;
  email: string;
  password: string;
}

Response: {
  user: {
    id: string;
    name: string;
    email: string;
    role: 'user';
    createdAt: string;
  };
  session: {
    token: string;
    expiresAt: string;
  };
}
```

### GET /me
```typescript
Response: {
  user: {
    id: string;
    name: string;
    email: string;
    role: 'viewer' | 'user' | 'admin';
    createdAt: string;
  };
  profile: {
    id: string;
    displayName: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
    // ... other profile fields
  };
}
```

## Cars

### GET /cars?userId={userId}
```typescript
Response: Car[]
```

### GET /cars/{carId}
```typescript
Response: Car
```

### POST /cars
```typescript
Request: {
  name: string;
  make: string;
  model: string;
  year: number;
  color: string;
  // ... other car fields
}

Response: Car
```

### PATCH /cars/{carId}
```typescript
Request: Partial<Car>
Response: Car
```

### DELETE /cars/{carId}
```typescript
Response: { success: boolean }
```

## Logbook

### GET /logbook?carId={carId}
```typescript
Response: LogbookEntry[]
```

### GET /logbook/{entryId}
```typescript
Response: LogbookEntry
```

### POST /logbook
```typescript
Request: {
  carId: string;
  title: string;
  content: string;
  topic: 'service' | 'repair' | 'tuning' | 'trip' | 'other';
  photos?: string[];
  mileage?: number;
  mileageUnit?: 'km' | 'mi';
  cost?: number;
  currency?: string;
  poll?: {
    question: string;
    options: string[];
  };
  allowComments: boolean;
  pinOnCar?: boolean;
  language?: string;
}

Response: LogbookEntry
```

### PATCH /logbook/{entryId}
```typescript
Request: Partial<LogbookEntry>
Response: LogbookEntry
```

### DELETE /logbook/{entryId}
```typescript
Response: { success: boolean }
```

### POST /logbook/{entryId}/like
```typescript
Response: { success: boolean; liked: boolean }
```

### DELETE /logbook/{entryId}/like
```typescript
Response: { success: boolean }
```

## Comments

### GET /logbook/{entryId}/comments
```typescript
Response: Comment[]
```

### POST /logbook/{entryId}/comments
```typescript
Request: {
  text: string;
  parentId?: string;
  images?: string[];
}

Response: Comment
```

### PATCH /comments/{commentId}
```typescript
Request: {
  text: string;
}

Response: Comment
```

### DELETE /comments/{commentId}
```typescript
Response: { success: boolean }
```

## Types

```typescript
interface Car {
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
  ownerId: string;
  ownerAge?: number;
  ownerCity?: string;
  previousCar?: string;
}

interface LogbookEntry {
  id: string;
  userId: string;
  carId: string;
  title: string;
  content: string;
  topic: 'service' | 'repair' | 'tuning' | 'trip' | 'other';
  photos: string[];
  mileage?: number;
  mileageUnit?: 'km' | 'mi';
  cost?: number;
  currency?: string;
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
}

interface Comment {
  id: string;
  text: string;
  author: string;
  authorEmail: string;
  timestamp: string;
  likes: number;
  carId: string;
  parentId?: string;
  replies?: Comment[];
  isEdited?: boolean;
  editedAt?: string;
  images?: string[];
}
```
