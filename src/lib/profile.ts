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

const KEY = 'fahrme:profile';

export function readProfile(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; }
}

export function saveProfile(p: UserProfile) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(p));
}

export function updateProfile(patch: Partial<UserProfile>) {
  const prev = readProfile() || { id: 'local', displayName: 'Guest' } as UserProfile;
  const next = { ...prev, ...patch };
  saveProfile(next);
  return next;
}
