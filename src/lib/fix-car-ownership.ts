// Утилита для исправления владения автомобилями
// Запускается один раз для исправления существующих данных

import { STORAGE_KEYS } from './keys';

export function fixCarOwnership(userId: string, userEmail?: string) {
  const savedCars = localStorage.getItem(STORAGE_KEYS.MY_CARS_KEY);
  if (!savedCars) return;

  try {
    const cars = JSON.parse(savedCars);
    let hasChanges = false;

    const updatedCars = cars.map((car: { [key: string]: any; ownerId?: string; name?: string; make?: string; model?: string }) => {
      // Если у автомобиля нет владельца, устанавливаем текущего пользователя
      if (!car.ownerId) {
        car.ownerId = userId;
        hasChanges = true;
        console.log(`Исправлен владелец для автомобиля ${car.name || car.make} ${car.model}`);
      }
      // Если ownerId содержит email, а не userId, обновляем его
      else if (userEmail && car.ownerId === userEmail) {
        car.ownerId = userId;
        hasChanges = true;
        console.log(`Обновлен владелец с email на userId для автомобиля ${car.name || car.make} ${car.model}`);
      }
      return car;
    });

    if (hasChanges) {
      localStorage.setItem(STORAGE_KEYS.MY_CARS_KEY, JSON.stringify(updatedCars));
      console.log('Владение автомобилями исправлено');
      return true;
    } else {
      console.log('Все автомобили уже имеют владельцев');
      return false;
    }
  } catch (error) {
    console.error('Ошибка при исправлении владения:', error);
    return false;
  }
}

// Функция для проверки, является ли пользователь владельцем автомобиля
export function isCarOwner(car: { ownerId?: string }, userId: string, userEmail?: string): boolean {
  if (!car || !car.ownerId) return false;
  
  // Проверяем по userId (новый формат)
  if (car.ownerId === userId) return true;
  
  // Проверяем по email (старый формат для обратной совместимости)
  if (userEmail && car.ownerId === userEmail) return true;
  
  return false;
}
