"use client";

import { 
  AuthService, 
  User, 
  Session, 
  LoginCredentials, 
  RegisterCredentials, 
  AuthResult, 
  AuthStateChangeCallback 
} from './types';
import { STORAGE_KEYS, getKeysToClearOnLogout, getDraftKeysToClear } from '@/lib/keys';

export class LocalAuthService implements AuthService {
  private listeners: Set<AuthStateChangeCallback> = new Set();

  constructor() {
    this.setupStorageListener();
  }

  private setupStorageListener(): void {
    if (typeof window === 'undefined') return;
    
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEYS.SESSION_KEY) {
        const user = this.getCurrentUser();
        this.notifyListeners(user);
      }
    });
  }

  private notifyListeners(user: User | null): void {
    this.listeners.forEach(callback => {
      try {
        callback(user);
      } catch (error) {
        console.error('Error in auth listener:', error);
      }
    });
  }

  private readJSON<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined') return fallback;
    
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch { 
      return fallback; 
    }
  }

  private writeJSON(key: string, value: unknown): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  }

  private removeItem(key: string): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  }

  // Core operations
  getCurrentUser(): User | null {
    const session = this.readJSON<{ userId?: string; email?: string } | null>(STORAGE_KEYS.SESSION_KEY, null);
    console.info('[auth] Session data:', session);
    
    if (!session) {
      console.info('[auth] No session found');
      return null;
    }
    
    // Migration: if session only has email, find user and update session
    if (session.email && !session.userId) {
      console.info('[auth] Migrating session from email to userId');
      const user = this.getUsers().find(u => u.email === session.email);
      if (user) {
        this.setSession({ userId: user.id, email: user.email });
        console.info('[auth] Session migrated successfully');
        return user;
      }
      console.info('[auth] User not found for email:', session.email);
      return null;
    }
    
    if (session.userId) {
      const user = this.getUsers().find(u => u.id === session.userId);
      console.info('[auth] User found by userId:', user ? 'yes' : 'no');
      return user ?? null;
    }
    
    return null;
  }

  async login(credentials: LoginCredentials): Promise<AuthResult> {
    const user = this.getUsers().find(u => u.email.toLowerCase() === credentials.email.toLowerCase());
    if (!user) {
      return { success: false, error: "E-Mail ist nicht registriert." };
    }
    if (user.password !== credentials.password) {
      return { success: false, error: "Falsches Passwort." };
    }
    
    this.setSession({ userId: user.id, email: user.email });
    this.notifyListeners(user);
    return { success: true, user };
  }

  async register(credentials: RegisterCredentials): Promise<AuthResult> {
    const users = this.getUsers();
    const exists = users.some(u => u.email.toLowerCase() === credentials.email.toLowerCase());
    if (exists) {
      return { success: false, error: "E-Mail ist schon vergeben." };
    }
    
    const user: User = {
      id: `u_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`,
      name: credentials.name,
      email: credentials.email,
      password: credentials.password,
      createdAt: Date.now()
    };
    
    users.push(user);
    this.saveUsers(users);
    this.setSession({ userId: user.id, email: user.email });
    this.notifyListeners(user);
    return { success: true, user };
  }

  async logout(): Promise<void> {
    console.info('[auth] Clearing session...');
    
    // Clear main session keys
    const keysToClear = getKeysToClearOnLogout();
    keysToClear.forEach(key => {
      this.removeItem(key);
    });
    
    // Clear all draft keys
    const draftKeys = getDraftKeysToClear();
    draftKeys.forEach(key => {
      this.removeItem(key);
      console.info('[auth] Removed draft:', key);
    });
    
    // Trigger multi-tab sync
    this.writeJSON(STORAGE_KEYS.SESSION_KEY, '');
    this.removeItem(STORAGE_KEYS.SESSION_KEY);
    
    // НЕ удаляем 'fahrme:users' - это список всех пользователей!
    console.info('[auth] Session cleared, removed', draftKeys.length, 'drafts');
    
    this.notifyListeners(null);
  }

  // Session management
  getSession(): Session | null {
    const session = this.readJSON<{ userId?: string; email?: string } | null>(STORAGE_KEYS.SESSION_KEY, null);
    if (session && session.userId && session.email) {
      return { userId: session.userId, email: session.email };
    }
    return null;
  }

  setSession(session: Session): void {
    this.writeJSON(STORAGE_KEYS.SESSION_KEY, session);
  }

  clearSession(): void {
    this.removeItem(STORAGE_KEYS.SESSION_KEY);
  }

  // User management
  getUsers(): User[] {
    return this.readJSON<User[]>(STORAGE_KEYS.USERS_KEY, []);
  }

  saveUsers(users: User[]): void {
    this.writeJSON(STORAGE_KEYS.USERS_KEY, users);
  }

  // Event handling
  onAuthStateChanged(callback: AuthStateChangeCallback): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Utilities
  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }

  isGuest(): boolean {
    return !this.isAuthenticated();
  }
}
