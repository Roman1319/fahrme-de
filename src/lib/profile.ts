export type Gender = 'm' | 'w' | 'x' | null;

export type UserProfile = {
  id: string;
  displayName: string;       // Spitzname
  firstName?: string;
  lastName?: string;
  gender?: Gender;
  birthDate?: string | null; // ISO yyyy-mm-dd
  about?: string;

  phone?: string | null;
  email?: string | null;

  primaryLanguage?: string | null;   // Hauptsprache
  otherLanguages?: string[];         // Ich kann lesen…

  country?: string | null;
  city?: string | null;

  avatarUrl?: string | null; // dataURL
};

// Unified LocalStorage keys
import { STORAGE_KEYS } from './keys';

const PROFILE_KEY = STORAGE_KEYS.PROFILE_KEY;

export function readProfile(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null'); } catch { return null; }
}

export function saveProfile(p: UserProfile) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
}

export function updateProfile(patch: Partial<UserProfile>) {
  const prev = readProfile() || { id: 'local', displayName: 'Guest' } as UserProfile;
  const next = { ...prev, ...patch };
  saveProfile(next);
  return next;
}

export function readProfileByEmail(email: string): UserProfile | null {
  try {
    // В реальном приложении здесь был бы запрос к серверу
    // Пока что используем текущий профиль если email совпадает
    const currentProfile = readProfile();
    if (currentProfile?.email === email) {
      return currentProfile;
    }
    
    // Для демо-целей создаем базовый профиль
    return {
      id: email,
      displayName: email.split('@')[0],
      email: email,
      avatarUrl: null,
      otherLanguages: []
    };
  } catch {
    return null;
  }
}