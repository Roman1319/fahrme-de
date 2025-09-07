// Утилита для миграции автомобилей на новую систему
// Запускается один раз при обновлении

import { STORAGE_KEYS } from './keys';

const OLD_CARS_KEY = STORAGE_KEYS.OLD_CARS_KEY;
const NEW_CARS_KEY_PREFIX = STORAGE_KEYS.NEW_CARS_KEY_PREFIX;

export function migrateCars() {
  if (typeof window === 'undefined') return;
  
  try {
    // Проверяем, есть ли старые автомобили
    const oldCars = localStorage.getItem(OLD_CARS_KEY);
    if (!oldCars) {
      console.log('No old cars found, migration not needed');
      return;
    }
    
    // Получаем текущего пользователя
    const session = localStorage.getItem(STORAGE_KEYS.SESSION_KEY);
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
    
    // Парсим старые автомобили
    const carsData = JSON.parse(oldCars);
    
    // Проверяем, есть ли уже автомобили для этого пользователя
    const newKey = `${NEW_CARS_KEY_PREFIX}${currentUserEmail}`;
    const existingCars = localStorage.getItem(newKey);
    
    if (existingCars) {
      console.log('Cars already exist for user, migration skipped');
      return;
    }
    
    // Обновляем ownerId для всех автомобилей
    const migratedCars = carsData.map((car: any) => ({
      ...car,
      ownerId: currentUserEmail
    }));
    
    // Сохраняем автомобили под новым ключом
    localStorage.setItem(newKey, JSON.stringify(migratedCars));
    
    // Удаляем старый ключ
    localStorage.removeItem(OLD_CARS_KEY);
    
    console.log('Cars migrated successfully for user:', currentUserEmail);
    console.log('Migrated cars:', migratedCars.length);
    
    // Показываем уведомление пользователю
    alert(`Автомобили успешно мигрированы! Перенесено ${migratedCars.length} автомобилей.`);
    
  } catch (error) {
    console.error('Error during cars migration:', error);
  }
}

// Автоматически запускаем миграцию при импорте
if (typeof window !== 'undefined') {
  migrateCars();
}
