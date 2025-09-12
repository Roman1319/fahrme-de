import { getAuthReady, getGlobalUser } from './supabaseClient';

// Утилита для безопасных API вызовов с проверкой authReady
export const safeApiCall = async <T>(
  url: string, 
  options: RequestInit = {}
): Promise<T> => {
  // Проверяем что аутентификация готова
  if (!getAuthReady()) {
    throw new Error('Authentication not ready');
  }

  // Добавляем credentials: include ко всем запросам
  const safeOptions: RequestInit = {
    ...options,
    credentials: 'include',
  };

  // Добавляем токен авторизации если пользователь авторизован
  const user = getGlobalUser();
  if (user) {
    const { data: { session } } = await import('./supabaseClient').then(m => m.supabase.auth.getSession());
    if (session?.access_token) {
      safeOptions.headers = {
        ...safeOptions.headers,
        'Authorization': `Bearer ${session.access_token}`,
      };
    }
  }

  const response = await fetch(url, safeOptions);
  
  if (!response.ok) {
    throw new Error(`API call failed: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};

// Утилита для проверки готовности аутентификации
export const waitForAuth = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (getAuthReady()) {
      resolve(true);
      return;
    }
    
    // Подписываемся на изменения authReady
    const { onAuthStateChange } = require('./supabaseClient');
    const unsubscribe = onAuthStateChange((_, ready) => {
      if (ready) {
        unsubscribe();
        resolve(true);
      }
    });
  });
};
