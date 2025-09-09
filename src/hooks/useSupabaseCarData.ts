import { useState, useEffect, useCallback } from 'react';
import { getBrands, getModelsByBrandName, searchBrands, searchModels } from '@/lib/car-brands';

export interface CarMake {
  id: number;
  name: string;
  logo?: string;
  created_at: string;
  updated_at: string;
}

export interface CarModel {
  id: number;
  brand_id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export function useSupabaseCarData() {
  const [isLoading, setIsLoading] = useState(true);
  const [makes, setMakes] = useState<CarMake[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Загружаем данные при инициализации
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const brands = await getBrands();
        setMakes(brands);
        console.log(`[useSupabaseCarData] Loaded ${brands.length} brands from Supabase`);
      } catch (err) {
        console.error('[useSupabaseCarData] Error loading car data:', err);
        setError('Failed to load car data from Supabase');
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
  const getModels = useCallback(async (makeName: string): Promise<string[]> => {
    try {
      const models = await getModelsByBrandName(makeName);
      return models.map(model => model.name);
    } catch (error) {
      console.error('[useSupabaseCarData] Error getting models:', error);
      return [];
    }
  }, []);

  // Поиск автомобилей
  const searchCars = useCallback(async (query: {
    make?: string;
    model?: string;
    year?: number;
    limit?: number;
  }) => {
    try {
      let brands: CarMake[] = [];
      let models: CarModel[] = [];

      if (query.make) {
        brands = await searchBrands(query.make);
      } else {
        brands = makes;
      }

      if (query.model) {
        for (const brand of brands) {
          const brandModels = await searchModels(query.model, brand.id);
          models.push(...brandModels);
        }
      } else {
        for (const brand of brands) {
          const brandModels = await getModelsByBrandName(brand.name);
          models.push(...brandModels);
        }
      }

      // Фильтруем по году если указан
      if (query.year) {
        // Здесь можно добавить фильтрацию по году если нужно
      }

      // Ограничиваем количество результатов
      if (query.limit) {
        models = models.slice(0, query.limit);
      }

      return models;
    } catch (error) {
      console.error('[useSupabaseCarData] Error searching cars:', error);
      return [];
    }
  }, [makes]);

  // Проверяет валидность автомобиля
  const isValidCar = useCallback(async (make: string, model: string, year?: number): Promise<boolean> => {
    try {
      const models = await getModelsByBrandName(make);
      return models.some(m => m.name.toLowerCase() === model.toLowerCase());
    } catch (error) {
      console.error('[useSupabaseCarData] Error validating car:', error);
      return false;
    }
  }, []);

  // Получает статистику
  const getStats = useCallback(() => {
    return {
      totalMakes: makes.length,
      totalModels: 0, // Будет обновлено после загрузки моделей
      yearRange: {
        min: 1992,
        max: new Date().getFullYear()
      }
    };
  }, [makes]);

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
