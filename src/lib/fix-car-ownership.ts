// Утилита для исправления владения автомобилями
// Запускается один раз для исправления существующих данных

export function fixCarOwnership(userEmail: string) {
  const savedCars = localStorage.getItem('fahrme:my-cars');
  if (!savedCars) return;

  try {
    const cars = JSON.parse(savedCars);
    let hasChanges = false;

    const updatedCars = cars.map((car: any) => {
      // Если у автомобиля нет владельца, устанавливаем текущего пользователя
      if (!car.ownerId) {
        car.ownerId = userEmail;
        hasChanges = true;
        console.log(`Исправлен владелец для автомобиля ${car.name || car.make} ${car.model}`);
      }
      return car;
    });

    if (hasChanges) {
      localStorage.setItem('fahrme:my-cars', JSON.stringify(updatedCars));
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
export function isCarOwner(car: any, userEmail: string): boolean {
  return car && car.ownerId === userEmail;
}
