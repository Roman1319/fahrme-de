// Утилита для очистки всех профилей (только для разработки)
// Используйте с осторожностью!

import { STORAGE_KEYS } from './keys';

export function clearAllProfiles() {
  if (typeof window === 'undefined') return;
  
  try {
    // Получаем все ключи из localStorage
    const keys = Object.keys(localStorage);
    
    // Удаляем все ключи профилей
    keys.forEach(key => {
      if (key.startsWith(STORAGE_KEYS.NEW_PROFILE_KEY_PREFIX)) {
        localStorage.removeItem(key);
        console.log('Removed profile:', key);
      }
    });
    
    // Также удаляем старый ключ профиля
    localStorage.removeItem(STORAGE_KEYS.OLD_PROFILE_KEY);
    
    console.log('All profiles cleared successfully');
    alert('Все профили очищены!');
    
  } catch (error) {
    console.error('Error clearing profiles:', error);
    alert('Ошибка при очистке профилей: ' + error);
  }
}

// Добавляем в window для доступа из консоли браузера
if (typeof window !== 'undefined') {
  (window as unknown as { clearAllProfiles?: () => void }).clearAllProfiles = clearAllProfiles;
}
