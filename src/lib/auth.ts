"use client";

export type User = {
  id: string;
  name: string;
  email: string;
  password: string; // ВНИМАНИЕ: только для MVP, в проде пароли не храним на клиенте
  createdAt: number;
};

// Unified LocalStorage keys
const USERS_KEY = "fahrme:users";
const SESSION_KEY = "fahrme:session";

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch { return fallback; }
}

function writeJSON(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getUsers(): User[] {
  return readJSON<User[]>(USERS_KEY, []);
}
export function saveUsers(users: User[]) {
  writeJSON(USERS_KEY, users);
}

export function currentUser(): User | null {
  const session = readJSON<{ userId?: string; email?: string } | null>(SESSION_KEY, null);
  console.info('[auth] Session data:', session);
  
  if (!session) {
    console.info('[auth] No session found');
    return null;
  }
  
  // Migration: if session only has email, find user and update session
  if (session.email && !session.userId) {
    console.info('[auth] Migrating session from email to userId');
    const user = getUsers().find(u => u.email === session.email);
    if (user) {
      setSession({ userId: user.id, email: user.email });
      console.info('[auth] Session migrated successfully');
      return user;
    }
    console.info('[auth] User not found for email:', session.email);
    return null;
  }
  
  if (session.userId) {
    const user = getUsers().find(u => u.id === session.userId);
    console.info('[auth] User found by userId:', user ? 'yes' : 'no');
    return user ?? null;
  }
  
  return null;
}

export function login(email: string, password: string): string | null {
  const user = getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) return "E-Mail ist nicht registriert.";
  if (user.password !== password) return "Falsches Passwort.";
  setSession({ userId: user.id, email: user.email });
  return null; // ok
}

export function logout() {
  clearSession();
  // НЕ удаляем 'fahrme:users' - это список всех пользователей!
}

export function register(name: string, email: string, password: string): string | null {
  const users = getUsers();
  const exists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
  if (exists) return "E-Mail ist schon vergeben.";
  const user: User = {
    id: `u_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`,
    name, email, password, createdAt: Date.now()
  };
  users.push(user);
  saveUsers(users);
  setSession({ userId: user.id, email: user.email });
  return null; // ok
}

// Session management functions
export function getSession(): { userId?: string; email?: string } | null {
  return readJSON<{ userId?: string; email?: string } | null>(SESSION_KEY, null);
}

export function setSession(session: { userId: string; email: string }): void {
  writeJSON(SESSION_KEY, session);
}

export function clearSession(): void {
  console.info('[auth] Clearing session...');
  
  // Удаляем основные ключи сессии
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem('fahrme:profile');
  localStorage.removeItem('fahrme:user');
  
  // Удаляем все черновики логбука
  const keys = Object.keys(localStorage);
  const draftKeys = keys.filter(key => key.startsWith('fahrme:logbook:draft:'));
  draftKeys.forEach(key => {
    localStorage.removeItem(key);
    console.info('[auth] Removed draft:', key);
  });
  
  // НЕ удаляем 'fahrme:users' - это список всех пользователей!
  console.info('[auth] Session cleared, removed', draftKeys.length, 'drafts');
}

export function getCurrentUser(): User | null {
  return currentUser();
}
