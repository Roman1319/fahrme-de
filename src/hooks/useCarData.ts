import { useState, useEffect, useCallback } from 'react';
import { carDatabase, CarMake, CarData } from '@/lib/car-data';

export function useCarData() {
  const [isLoading, setIsLoading] = useState(true);
  const [makes, setMakes] = useState<CarMake[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Загружаем данные при инициализации
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        await carDatabase.loadData();
        const loadedMakes = carDatabase.getMakes();
        setMakes(loadedMakes);
        console.log(`Hook: Loaded ${loadedMakes.length} makes`);
      } catch (err) {
        console.error('Error loading car data:', err);
        setError('Failed to load car data');
        // Устанавливаем пустой массив марок, чтобы не ломать интерфейс
        setMakes([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Получает все марки
  const getMakes = useCallback(() => {
    return makes;
  }, [makes]);

  // Получает модели для марки
  const getModels = useCallback((makeName: string) => {
    return carDatabase.getModels(makeName);
  }, []);

  // Поиск автомобилей
  const searchCars = useCallback((query: {
    make?: string;
    model?: string;
    year?: number;
    limit?: number;
  }) => {
    return carDatabase.searchCars(query);
  }, []);

  // Проверяет валидность автомобиля
  const isValidCar = useCallback((make: string, model: string, year?: number) => {
    return carDatabase.isValidCar(make, model, year);
  }, []);

  // Получает статистику
  const getStats = useCallback(() => {
    return carDatabase.getStats();
  }, []);

  return {
    isLoading,
    makes,
    error,
    getMakes,
    getModels,
    searchCars,
    isValidCar,
    getStats
  };
}
