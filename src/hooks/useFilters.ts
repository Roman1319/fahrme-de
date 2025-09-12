import { useState, useEffect, useCallback } from 'react';

export interface FilterOption {
  id: string | number | null;
  name: string;
  logo?: string;
  description?: string;
}

export interface FilterState {
  car_brand: string;
  car_model: string;
  topic: string;
  year_from: string;
  year_to: string;
}

export interface YearRange {
  min: number;
  max: number;
}

export function useFilters() {
  const [brands, setBrands] = useState<FilterOption[]>([]);
  const [models, setModels] = useState<FilterOption[]>([]);
  const [yearRange, setYearRange] = useState<YearRange>({ min: 1900, max: new Date().getFullYear() });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Загрузить бренды
  const loadBrands = useCallback(async (source: 'cars' | 'brands' = 'cars') => {
    try {
      const response = await fetch(`/api/filters/brands?source=${source}`);
      if (!response.ok) {
        throw new Error('Failed to load brands');
      }
      const data = await response.json();
      setBrands(data);
    } catch (error) {
      console.error('Error loading brands:', error);
      setError('Failed to load brands');
    }
  }, []);

  // Загрузить модели для выбранного бренда
  const loadModels = useCallback(async (brand: string, source: 'cars' | 'car_models' = 'cars') => {
    if (!brand) {
      setModels([]);
      return;
    }

    try {
      const response = await fetch(`/api/filters/models?brand=${encodeURIComponent(brand)}&source=${source}`);
      if (!response.ok) {
        throw new Error('Failed to load models');
      }
      const data = await response.json();
      setModels(data);
    } catch (error) {
      console.error('Error loading models:', error);
      setError('Failed to load models');
    }
  }, []);

  // Загрузить диапазон годов
  const loadYearRange = useCallback(async () => {
    try {
      const response = await fetch('/api/filters/years');
      if (!response.ok) {
        throw new Error('Failed to load year range');
      }
      const data = await response.json();
      setYearRange(data);
    } catch (error) {
      console.error('Error loading year range:', error);
      setError('Failed to load year range');
    }
  }, []);

  // Инициализация фильтров
  const initializeFilters = useCallback(async (source: 'cars' | 'brands' = 'cars') => {
    setIsLoading(true);
    setError(null);

    try {
      await Promise.all([
        loadBrands(source),
        loadYearRange()
      ]);
    } catch (error) {
      console.error('Error initializing filters:', error);
      setError('Failed to initialize filters');
    } finally {
      setIsLoading(false);
    }
  }, [loadBrands, loadYearRange]);

  // Очистить модели при смене бренда
  const handleBrandChange = useCallback((brand: string, source: 'cars' | 'car_models' = 'cars') => {
    setModels([]);
    if (brand) {
      loadModels(brand, source);
    }
  }, [loadModels]);

  // Создать опции для селектов
  const createSelectOptions = useCallback((items: FilterOption[], placeholder: string) => {
    return [
      { value: '', label: placeholder },
      ...items.map(item => ({
        value: item.name,
        label: item.name
      }))
    ];
  }, []);

  // Создать опции для годов
  const createYearOptions = useCallback((placeholder: string) => {
    const years = [];
    for (let year = yearRange.max; year >= yearRange.min; year--) {
      years.push({ value: year.toString(), label: year.toString() });
    }
    return [
      { value: '', label: placeholder },
      ...years
    ];
  }, [yearRange]);

  // Получить активные фильтры
  const getActiveFilters = useCallback((filters: FilterState) => {
    const active: string[] = [];
    if (filters.car_brand) active.push(`Бренд: ${filters.car_brand}`);
    if (filters.car_model) active.push(`Модель: ${filters.car_model}`);
    if (filters.topic) active.push(`Тема: ${filters.topic}`);
    if (filters.year_from) active.push(`Год от: ${filters.year_from}`);
    if (filters.year_to) active.push(`Год до: ${filters.year_to}`);
    return active;
  }, []);

  // Очистить все фильтры
  const clearFilters = useCallback(() => {
    setModels([]);
  }, []);

  // Проверить, есть ли активные фильтры
  const hasActiveFilters = useCallback((filters: FilterState) => {
    return !!(filters.car_brand || filters.car_model || filters.topic || filters.year_from || filters.year_to);
  }, []);

  return {
    brands,
    models,
    yearRange,
    isLoading,
    error,
    loadBrands,
    loadModels,
    loadYearRange,
    initializeFilters,
    handleBrandChange,
    createSelectOptions,
    createYearOptions,
    getActiveFilters,
    clearFilters,
    hasActiveFilters
  };
}
