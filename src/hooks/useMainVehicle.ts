import { useState, useEffect } from 'react';
import { MyCar } from '@/lib/types';

export function useMainVehicle() {
  const [mainVehicle, setMainVehicle] = useState<MyCar | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadMainVehicle = () => {
      try {
        const savedCars = localStorage.getItem('fahrme:my-cars');
        if (savedCars) {
          const cars: MyCar[] = JSON.parse(savedCars);
          const main = cars.find(car => car.isMainVehicle === true);
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
  }, []);

  return { mainVehicle, isLoading };
}
