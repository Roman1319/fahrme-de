// Authentication service contracts and types

export type User = {
  id: string;
  name: string;
  email: string;
  password: string; // ВНИМАНИЕ: только для MVP, в проде пароли не храним на клиенте
  createdAt: number;
};

export type Session = {
  userId: string;
  email: string;
};

export type LoginCredentials = {
  email: string;
  password: string;
};

export type RegisterCredentials = {
  name: string;
  email: string;
  password: string;
};

export type AuthResult = {
  success: boolean;
  error?: string;
  user?: User;
};

export type AuthStateChangeCallback = (user: User | null) => void;

// Main authentication service interface
export interface AuthService {
  // Core operations
  getCurrentUser(): User | null;
  login(credentials: LoginCredentials): Promise<AuthResult>;
  register(credentials: RegisterCredentials): Promise<AuthResult>;
  logout(): Promise<void>;
  
  // Session management
  getSession(): Session | null;
  setSession(session: Session): void;
  clearSession(): void;
  
  // User management
  getUsers(): User[];
  saveUsers(users: User[]): void;
  
  // Event handling
  onAuthStateChanged(callback: AuthStateChangeCallback): () => void;
  
  // Utilities
  isAuthenticated(): boolean;
  isGuest(): boolean;
}
