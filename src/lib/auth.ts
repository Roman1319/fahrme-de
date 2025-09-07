// Legacy auth.ts - thin wrapper for backward compatibility
// Re-exports from the new auth service

export { 
  getAuthService,
  type User,
  type Session,
  type LoginCredentials,
  type RegisterCredentials,
  type AuthResult,
  type AuthStateChangeCallback,
  type AuthService
} from '@/services/auth';

// Legacy function exports for backward compatibility
import { getAuthService } from '@/services/auth';

const auth = getAuthService();

export function getCurrentUser() {
  return auth.getCurrentUser();
}

export function currentUser() {
  return auth.getCurrentUser();
}

export function getUsers() {
  return auth.getUsers();
}

export function saveUsers(users: { id: string; email: string; name: string; password: string; createdAt: number }[]) {
  auth.saveUsers(users);
}

export function getSession() {
  return auth.getSession();
}

export function setSession(session: { userId: string; email: string } | null) {
  if (session) {
    auth.setSession(session);
  } else {
    auth.clearSession();
  }
}

export function clearSession() {
  auth.clearSession();
}

export function login(email: string, password: string): Promise<string | null> {
  // Legacy sync function - convert to async
  return new Promise((resolve) => {
    auth.login({ email, password }).then(result => {
      resolve(result.error || null);
    });
  });
}

export function register(name: string, email: string, password: string): Promise<string | null> {
  // Legacy sync function - convert to async
  return new Promise((resolve) => {
    auth.register({ name, email, password }).then(result => {
      resolve(result.error || null);
    });
  });
}

export function logout() {
  auth.logout();
}
