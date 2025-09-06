// Интерфейс для системы авторизации
// Позволяет легко заменить LocalAuthService на ApiAuthService

export interface User {
  userId: string;
  handle: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  createdAt: number;
  updatedAt: number;
}

export interface AccountRecord {
  userId: string;
  handle: string;
  email?: string;
  passwordHash?: string; // В демо - заглушка
  createdAt: number;
  lastLoginAt?: number;
}

export interface Session {
  userId: string;
  issuedAt: number;
  expiresAt?: number;
}

export interface SignUpPayload {
  handle: string;
  displayName: string;
  email?: string;
  password?: string;
}

export interface SignInPayload {
  handle?: string;
  email?: string;
  password?: string;
}

export interface AuthService {
  // Основные операции
  getCurrent(): Session | null;
  signUp(payload: SignUpPayload): { success: boolean; error?: string; userId?: string };
  signIn(payload: SignInPayload): { success: boolean; error?: string; userId?: string };
  signOut(): void;
  
  // Управление пользователями
  getUsers(): AccountRecord[];
  switchUser(userId: string): boolean;
  deleteUser(userId: string): boolean;
  
  // Профили
  getUserProfile(userId: string): User | null;
  updateUserProfile(userId: string, updates: Partial<User>): boolean;
  
  // События
  onChange(callback: (session: Session | null) => void): () => void;
  
  // Утилиты
  isGuest(): boolean;
  isAuthenticated(): boolean;
  getCurrentUserId(): string | null;
  
  // Очистка (для демо)
  clearAllData(): void;
  resetToGuest(): void;
}

// Типы для событий
export type AuthChangeEvent = {
  type: 'signin' | 'signout' | 'switch' | 'profile_update';
  userId?: string;
  session?: Session | null;
};
