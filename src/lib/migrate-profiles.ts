// Утилита для миграции старых профилей на новую систему
// Запускается один раз при обновлении

const OLD_PROFILE_KEY = 'fahrme:profile';
const NEW_PROFILE_KEY_PREFIX = 'fahrme:profile:';

export function migrateProfiles() {
  if (typeof window === 'undefined') return;
  
  try {
    // Проверяем, есть ли старый профиль
    const oldProfile = localStorage.getItem(OLD_PROFILE_KEY);
    if (!oldProfile) {
      console.log('No old profile found, migration not needed');
      return;
    }
    
    // Получаем текущего пользователя
    const session = localStorage.getItem('fahrme:session');
    if (!session) {
      console.log('No current user found, migration skipped');
      return;
    }
    
    let currentUserEmail: string | null = null;
    try {
      const sessionData = JSON.parse(session);
      currentUserEmail = sessionData.email || sessionData;
    } catch {
      currentUserEmail = session;
    }
    
    if (!currentUserEmail) {
      console.log('No current user found, migration skipped');
      return;
    }
    
    // Парсим старый профиль
    const profileData = JSON.parse(oldProfile);
    
    // Создаем новый ключ для текущего пользователя
    const newKey = `${NEW_PROFILE_KEY_PREFIX}${currentUserEmail}`;
    
    // Сохраняем профиль под новым ключом
    localStorage.setItem(newKey, oldProfile);
    
    // Удаляем старый ключ
    localStorage.removeItem(OLD_PROFILE_KEY);
    
    console.log('Profile migrated successfully for user:', currentUserEmail);
    
    // Показываем уведомление пользователю
    alert('Профиль успешно мигрирован на новую систему!');
    
  } catch (error) {
    console.error('Error during profile migration:', error);
  }
}

// Автоматически запускаем миграцию при импорте
if (typeof window !== 'undefined') {
  migrateProfiles();
}
