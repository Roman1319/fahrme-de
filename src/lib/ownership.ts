// Универсальная проверка права владения автомобилем

/**
 * Проверяет, является ли пользователь владельцем автомобиля
 * @param carOwnerId - ID владельца из записи автомобиля
 * @param userId - ID текущего пользователя
 * @param userEmail - Email текущего пользователя (для обратной совместимости)
 * @returns true если пользователь является владельцем
 */
export function isCarOwner(carOwnerId: string, userId: string, userEmail?: string): boolean {
  if (!carOwnerId || !userId) return false;
  
  // Проверяем по userId (новый формат)
  if (carOwnerId === userId) return true;
  
  // Проверяем по email (старый формат для обратной совместимости)
  if (userEmail && carOwnerId === userEmail) return true;
  
  return false;
}

/**
 * Проверяет, является ли пользователь владельцем автомобиля (обертка для объекта car)
 * @param car - Объект автомобиля
 * @param userId - ID текущего пользователя
 * @param userEmail - Email текущего пользователя (для обратной совместимости)
 * @returns true если пользователь является владельцем
 */
export function isCarOwnerByCar(car: { ownerId?: string } | null, userId: string, userEmail?: string): boolean {
  if (!car || !car.ownerId) return false;
  return isCarOwner(car.ownerId, userId, userEmail);
}
