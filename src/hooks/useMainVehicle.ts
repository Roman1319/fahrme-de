import { useState, useEffect } from 'react';
import { MyCar } from '@/lib/types';
import { STORAGE_KEYS } from '@/lib/keys';
import { useAuth } from '@/components/AuthProvider';

export function useMainVehicle() {
  const { user } = useAuth();
  const [mainVehicle, setMainVehicle] = useState<MyCar | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadMainVehicle = () => {
      if (!user) {
        setMainVehicle(null);
        setIsLoading(false);
        return;
      }

      try {
        const savedCars = localStorage.getItem(STORAGE_KEYS.MY_CARS_KEY);
        if (savedCars) {
          const cars: MyCar[] = JSON.parse(savedCars);
          // Фильтруем только автомобили текущего пользователя
          const userCars = cars.filter(car => car.ownerId === user.id);
          const main = userCars.find(car => car.isMainVehicle === true);
          setMainVehicle(main || null);
        } else {
          setMainVehicle(null);
        }
      } catch (error) {
        console.error('Error loading main vehicle:', error);
        setMainVehicle(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadMainVehicle();

    // Слушаем изменения в localStorage
    const handleStorageChange = () => {
      loadMainVehicle();
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Также слушаем изменения в том же окне
    const handleCustomStorageChange = () => {
      loadMainVehicle();
    };

    window.addEventListener('mainVehicleChanged', handleCustomStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('mainVehicleChanged', handleCustomStorageChange);
    };
  }, [user]);

  return { mainVehicle, isLoading };
}
