// Реализация AuthService для демо-режима с localStorage
import { AuthService, User, AccountRecord, Session, SignUpPayload, SignInPayload, AuthChangeEvent } from './auth-service';

const STORAGE_KEYS = {
  CURRENT_SESSION: 'fahrme:auth:current',
  USERS_REGISTRY: 'fahrme:auth:users',
  USER_PROFILE_PREFIX: 'fahrme:profile:',
  USER_GARAGE_PREFIX: 'fahrme:garage:',
  USER_LIKES_PREFIX: 'fahrme:likes:',
} as const;

// Rate limiting
const RATE_LIMITS = {
  SIGNIN_ATTEMPTS: 5,
  SIGNIN_WINDOW_MS: 60 * 1000, // 1 минута
  SIGNUP_ATTEMPTS: 3,
  SIGNUP_WINDOW_MS: 60 * 1000, // 1 минута
} as const;

class LocalAuthService implements AuthService {
  private listeners: Set<(session: Session | null) => void> = new Set();
  private useMemoryStorage = false;
  private memoryStorage: Map<string, any> = new Map();
  private rateLimitMap: Map<string, number[]> = new Map();

  constructor() {
    this.checkStorageAvailability();
    this.setupStorageListener();
  }

  private checkStorageAvailability(): void {
    try {
      const testKey = 'fahrme:auth:test';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      this.useMemoryStorage = false;
    } catch (error) {
      console.warn('localStorage not available, using memory storage:', error);
      this.useMemoryStorage = true;
    }
  }

  private getStorageItem(key: string): string | null {
    if (this.useMemoryStorage) {
      return this.memoryStorage.get(key) || null;
    }
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn('Error reading from localStorage, using memory storage:', error);
      this.useMemoryStorage = true;
      return this.memoryStorage.get(key) || null;
    }
  }

  private setStorageItem(key: string, value: string): void {
    if (this.useMemoryStorage) {
      this.memoryStorage.set(key, value);
      return;
    }
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.warn('Error writing to localStorage, using memory storage:', error);
      this.useMemoryStorage = true;
      this.memoryStorage.set(key, value);
    }
  }

  private removeStorageItem(key: string): void {
    if (this.useMemoryStorage) {
      this.memoryStorage.delete(key);
      return;
    }
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Error removing from localStorage, using memory storage:', error);
      this.useMemoryStorage = true;
      this.memoryStorage.delete(key);
    }
  }

  private setupStorageListener(): void {
    if (this.useMemoryStorage) return;
    
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEYS.CURRENT_SESSION) {
        const session = this.getCurrent();
        this.notifyListeners(session);
      }
    });
  }

  private notifyListeners(session: Session | null): void {
    this.listeners.forEach(callback => {
      try {
        callback(session);
      } catch (error) {
        console.error('Error in auth listener:', error);
      }
    });
  }

  private isRateLimited(action: 'signin' | 'signup', identifier: string): boolean {
    const now = Date.now();
    const key = `${action}:${identifier}`;
    const attempts = this.rateLimitMap.get(key) || [];
    
    // Удаляем старые попытки
    const recentAttempts = attempts.filter(time => now - time < RATE_LIMITS[action === 'signin' ? 'SIGNIN_WINDOW_MS' : 'SIGNUP_WINDOW_MS']);
    
    const limit = action === 'signin' ? RATE_LIMITS.SIGNIN_ATTEMPTS : RATE_LIMITS.SIGNUP_ATTEMPTS;
    
    if (recentAttempts.length >= limit) {
      return true;
    }
    
    // Добавляем текущую попытку
    recentAttempts.push(now);
    this.rateLimitMap.set(key, recentAttempts);
    
    return false;
  }

  private generateUserId(): string {
    return `u_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }

  private validateHandle(handle: string): { valid: boolean; error?: string } {
    if (!handle || handle.length < 3) {
      return { valid: false, error: 'Handle должен содержать минимум 3 символа' };
    }
    if (handle.length > 30) {
      return { valid: false, error: 'Handle не может содержать более 30 символов' };
    }
    if (!/^[a-zA-Z0-9_]+$/.test(handle)) {
      return { valid: false, error: 'Handle может содержать только латинские буквы, цифры и подчеркивания' };
    }
    return { valid: true };
  }

  private validateDisplayName(displayName: string): { valid: boolean; error?: string } {
    if (!displayName || displayName.trim().length < 1) {
      return { valid: false, error: 'Имя не может быть пустым' };
    }
    if (displayName.length > 50) {
      return { valid: false, error: 'Имя не может содержать более 50 символов' };
    }
    return { valid: true };
  }

  private isHandleUnique(handle: string, excludeUserId?: string): boolean {
    const users = this.getUsers();
    return !users.some(user => user.handle === handle && user.userId !== excludeUserId);
  }

  // Основные операции
  getCurrent(): Session | null {
    try {
      const sessionData = this.getStorageItem(STORAGE_KEYS.CURRENT_SESSION);
      if (!sessionData) return null;
      
      const session = JSON.parse(sessionData) as Session;
      
      // Проверяем, что пользователь все еще существует
      const users = this.getUsers();
      if (!users.some(user => user.userId === session.userId)) {
        this.signOut();
        return null;
      }
      
      return session;
    } catch (error) {
      console.error('Error getting current session:', error);
      return null;
    }
  }

  signUp(payload: SignUpPayload): { success: boolean; error?: string; userId?: string } {
    // Проверяем rate limiting
    if (this.isRateLimited('signup', payload.handle)) {
      return { success: false, error: 'Слишком много попыток регистрации. Попробуйте позже.' };
    }

    // Валидация
    const handleValidation = this.validateHandle(payload.handle);
    if (!handleValidation.valid) {
      return { success: false, error: handleValidation.error };
    }

    const displayNameValidation = this.validateDisplayName(payload.displayName);
    if (!displayNameValidation.valid) {
      return { success: false, error: displayNameValidation.error };
    }

    // Проверяем уникальность handle
    if (!this.isHandleUnique(payload.handle)) {
      return { success: false, error: 'Этот handle уже занят' };
    }

    try {
      const userId = this.generateUserId();
      const now = Date.now();

      // Создаем запись аккаунта
      const accountRecord: AccountRecord = {
        userId,
        handle: payload.handle,
        email: payload.email,
        passwordHash: payload.password ? 'demo_hash_' + Math.random().toString(36) : undefined,
        createdAt: now,
        lastLoginAt: now,
      };

      // Создаем профиль пользователя
      const userProfile: User = {
        userId,
        handle: payload.handle,
        displayName: payload.displayName.trim(),
        avatarUrl: undefined,
        bio: '',
        createdAt: now,
        updatedAt: now,
      };

      // Сохраняем данные
      const users = this.getUsers();
      users.push(accountRecord);
      this.setStorageItem(STORAGE_KEYS.USERS_REGISTRY, JSON.stringify(users));
      this.setStorageItem(`${STORAGE_KEYS.USER_PROFILE_PREFIX}${userId}`, JSON.stringify(userProfile));

      // Создаем пустые данные для пользователя
      this.setStorageItem(`${STORAGE_KEYS.USER_GARAGE_PREFIX}${userId}`, JSON.stringify([]));
      this.setStorageItem(`${STORAGE_KEYS.USER_LIKES_PREFIX}${userId}`, JSON.stringify({ set: [], counters: {} }));

      // Устанавливаем сессию
      const session: Session = {
        userId,
        issuedAt: now,
      };
      this.setStorageItem(STORAGE_KEYS.CURRENT_SESSION, JSON.stringify(session));

      this.notifyListeners(session);
      return { success: true, userId };
    } catch (error) {
      console.error('Error during signup:', error);
      return { success: false, error: 'Ошибка при регистрации' };
    }
  }

  signIn(payload: SignInPayload): { success: boolean; error?: string; userId?: string } {
    const identifier = payload.handle || payload.email || '';
    
    // Проверяем rate limiting
    if (this.isRateLimited('signin', identifier)) {
      return { success: false, error: 'Слишком много попыток входа. Попробуйте позже.' };
    }

    try {
      const users = this.getUsers();
      let user: AccountRecord | undefined;

      if (payload.handle) {
        user = users.find(u => u.handle === payload.handle);
      } else if (payload.email) {
        user = users.find(u => u.email === payload.email);
      }

      if (!user) {
        return { success: false, error: 'Пользователь не найден' };
      }

      // В демо не проверяем пароль, просто логиним
      const now = Date.now();
      user.lastLoginAt = now;

      // Обновляем время последнего входа
      this.setStorageItem(STORAGE_KEYS.USERS_REGISTRY, JSON.stringify(users));

      // Устанавливаем сессию
      const session: Session = {
        userId: user.userId,
        issuedAt: now,
      };
      this.setStorageItem(STORAGE_KEYS.CURRENT_SESSION, JSON.stringify(session));

      this.notifyListeners(session);
      return { success: true, userId: user.userId };
    } catch (error) {
      console.error('Error during signin:', error);
      return { success: false, error: 'Ошибка при входе' };
    }
  }

  signOut(): void {
    this.removeStorageItem(STORAGE_KEYS.CURRENT_SESSION);
    this.notifyListeners(null);
  }

  // Управление пользователями
  getUsers(): AccountRecord[] {
    try {
      const usersData = this.getStorageItem(STORAGE_KEYS.USERS_REGISTRY);
      return usersData ? JSON.parse(usersData) : [];
    } catch (error) {
      console.error('Error getting users:', error);
      return [];
    }
  }

  switchUser(userId: string): boolean {
    try {
      const users = this.getUsers();
      const user = users.find(u => u.userId === userId);
      
      if (!user) {
        return false;
      }

      const session: Session = {
        userId,
        issuedAt: Date.now(),
      };
      this.setStorageItem(STORAGE_KEYS.CURRENT_SESSION, JSON.stringify(session));
      this.notifyListeners(session);
      return true;
    } catch (error) {
      console.error('Error switching user:', error);
      return false;
    }
  }

  deleteUser(userId: string): boolean {
    try {
      const users = this.getUsers();
      const userIndex = users.findIndex(u => u.userId === userId);
      
      if (userIndex === -1) {
        return false;
      }

      // Удаляем пользователя из реестра
      users.splice(userIndex, 1);
      this.setStorageItem(STORAGE_KEYS.USERS_REGISTRY, JSON.stringify(users));

      // Удаляем все данные пользователя
      this.removeStorageItem(`${STORAGE_KEYS.USER_PROFILE_PREFIX}${userId}`);
      this.removeStorageItem(`${STORAGE_KEYS.USER_GARAGE_PREFIX}${userId}`);
      this.removeStorageItem(`${STORAGE_KEYS.USER_LIKES_PREFIX}${userId}`);

      // Если это текущий пользователь, выходим
      const current = this.getCurrent();
      if (current?.userId === userId) {
        this.signOut();
      }

      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }

  // Профили
  getUserProfile(userId: string): User | null {
    try {
      const profileData = this.getStorageItem(`${STORAGE_KEYS.USER_PROFILE_PREFIX}${userId}`);
      return profileData ? JSON.parse(profileData) : null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  updateUserProfile(userId: string, updates: Partial<User>): boolean {
    try {
      const currentProfile = this.getUserProfile(userId);
      if (!currentProfile) {
        return false;
      }

      // Валидация handle если он изменяется
      if (updates.handle && updates.handle !== currentProfile.handle) {
        const handleValidation = this.validateHandle(updates.handle);
        if (!handleValidation.valid) {
          return false;
        }
        if (!this.isHandleUnique(updates.handle, userId)) {
          return false;
        }
      }

      // Валидация displayName если он изменяется
      if (updates.displayName) {
        const displayNameValidation = this.validateDisplayName(updates.displayName);
        if (!displayNameValidation.valid) {
          return false;
        }
      }

      const updatedProfile: User = {
        ...currentProfile,
        ...updates,
        updatedAt: Date.now(),
      };

      this.setStorageItem(`${STORAGE_KEYS.USER_PROFILE_PREFIX}${userId}`, JSON.stringify(updatedProfile));
      return true;
    } catch (error) {
      console.error('Error updating user profile:', error);
      return false;
    }
  }

  // События
  onChange(callback: (session: Session | null) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Утилиты
  isGuest(): boolean {
    return this.getCurrent() === null;
  }

  isAuthenticated(): boolean {
    return this.getCurrent() !== null;
  }

  getCurrentUserId(): string | null {
    const session = this.getCurrent();
    return session?.userId || null;
  }

  // Очистка (для демо)
  clearAllData(): void {
    try {
      // Очищаем все данные fahrme
      const keys = this.useMemoryStorage 
        ? Array.from(this.memoryStorage.keys())
        : Object.keys(localStorage);
      
      keys.forEach(key => {
        if (key.startsWith('fahrme:')) {
          this.removeStorageItem(key);
        }
      });

      this.rateLimitMap.clear();
      this.notifyListeners(null);
    } catch (error) {
      console.error('Error clearing all data:', error);
    }
  }

  resetToGuest(): void {
    this.signOut();
  }
}

// Экспортируем singleton
export const authService = new LocalAuthService();
