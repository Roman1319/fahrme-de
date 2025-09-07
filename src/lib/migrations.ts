// Идемпотентные миграции данных

import { STORAGE_KEYS } from './keys';

const MIGRATION_FLAG_PREFIX = STORAGE_KEYS.MIGRATION_FLAG_PREFIX;

export function fixCarOwnershipOnce(userId: string, userEmail?: string): boolean {
  const flagKey = `${MIGRATION_FLAG_PREFIX}ownerIdToUserId:v1`;
  
  // Проверяем, была ли уже выполнена миграция
  if (localStorage.getItem(flagKey) === '1') {
    console.info('[migr] Car ownership migration already completed');
    return false;
  }

  console.info('[migr] Starting car ownership migration...');
  
  const savedCars = localStorage.getItem(STORAGE_KEYS.MY_CARS_KEY);
  if (!savedCars) {
    console.info('[migr] No cars found, marking migration as complete');
    localStorage.setItem(flagKey, '1');
    return false;
  }

  try {
    const cars = JSON.parse(savedCars);
    let hasChanges = false;
    let updatedCount = 0;

    const updatedCars = cars.map((car: { ownerId?: string; name?: string; make?: string; model?: string }) => {
      // Если ownerId выглядит как email и совпадает с userEmail, заменяем на userId
      if (userEmail && car.ownerId === userEmail) {
        car.ownerId = userId;
        hasChanges = true;
        updatedCount++;
        console.info('[migr] Updated car owner:', car.name || car.make, car.model);
      }
      // Если у автомобиля нет владельца, устанавливаем текущего пользователя
      else if (!car.ownerId) {
        car.ownerId = userId;
        hasChanges = true;
        updatedCount++;
        console.info('[migr] Set car owner:', car.name || car.make, car.model);
      }
      return car;
    });

    if (hasChanges) {
      localStorage.setItem(STORAGE_KEYS.MY_CARS_KEY, JSON.stringify(updatedCars));
      console.info('[migr] Updated', updatedCount, 'car(s)');
    } else {
      console.info('[migr] No cars needed updating');
    }

    // Отмечаем миграцию как выполненную
    localStorage.setItem(flagKey, '1');
    return hasChanges;
  } catch (error) {
    console.error('[migr] Error during car ownership migration:', error);
    return false;
  }
}

// Функция для сброса флагов миграции (для тестирования)
export function resetMigrationFlags(): void {
  const keys = Object.keys(localStorage);
  const migrationKeys = keys.filter(key => key.startsWith(MIGRATION_FLAG_PREFIX));
  migrationKeys.forEach(key => localStorage.removeItem(key));
  console.info('[migr] Reset migration flags:', migrationKeys.length);
}
