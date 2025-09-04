"use client";

export type User = {
  id: string;
  name: string;
  email: string;
  password: string; // ВНИМАНИЕ: только для MVP, в проде пароли не храним на клиенте
  createdAt: number;
};

const USERS_KEY = "fahrme.users";
const SESSION_KEY = "fahrme.session";

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
  const email = readJSON<string | null>(SESSION_KEY, null);
  if (!email) return null;
  return getUsers().find(u => u.email === email) ?? null;
}

export function login(email: string, password: string): string | null {
  const user = getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) return "E-Mail ist nicht registriert.";
  if (user.password !== password) return "Falsches Passwort.";
  writeJSON(SESSION_KEY, user.email);
  return null; // ok
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
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
  writeJSON(SESSION_KEY, user.email);
  return null; // ok
}
