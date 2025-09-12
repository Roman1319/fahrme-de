import { supabase } from './supabaseClient';

export interface FilterState {
  car_brand: string;
  car_model: string;
  topic: string;
  year_from: string;
  year_to: string;
}

export interface ExplorePost {
  id: string;
  title: string;
  content: string;
  author_handle: string;
  author_avatar_url: string;
  car_brand: string;
  car_model: string;
  car_year: number;
  car_name: string;
  media_preview: string;
  likes_count: number;
  comments_count: number;
  publish_date: string;
}

/**
 * Фильтрация на клиенте (для RPC результатов)
 */
export function filterPostsClientSide(posts: ExplorePost[], filters: FilterState): ExplorePost[] {
  return posts.filter(post => {
    // Фильтр по бренду
    if (filters.car_brand && post.car_brand !== filters.car_brand) {
      return false;
    }

    // Фильтр по модели
    if (filters.car_model && post.car_model !== filters.car_model) {
      return false;
    }

    // Фильтр по году от
    if (filters.year_from && post.car_year < parseInt(filters.year_from)) {
      return false;
    }

    // Фильтр по году до
    if (filters.year_to && post.car_year > parseInt(filters.year_to)) {
      return false;
    }

    return true;
  });
}

/**
 * Фильтрация на сервере (для прямых запросов к БД)
 */
export async function filterPostsServerSide(filters: FilterState, limit: number = 20, offset: number = 0): Promise<ExplorePost[]> {
  try {
    let query = supabase
      .from('logbook_entries')
      .select(`
        *,
        cars!logbook_entries_car_id_fkey(brand, model, year, name),
        profiles!logbook_entries_author_id_fkey(handle, avatar_url)
      `)
      .order('publish_date', { ascending: false })
      .range(offset, offset + limit - 1);

    // Применить фильтры
    if (filters.car_brand) {
      query = query.eq('cars.brand', filters.car_brand);
    }
    if (filters.car_model) {
      query = query.eq('cars.model', filters.car_model);
    }
    if (filters.topic) {
      query = query.eq('topic', filters.topic);
    }
    if (filters.year_from) {
      query = query.gte('cars.year', parseInt(filters.year_from));
    }
    if (filters.year_to) {
      query = query.lte('cars.year', parseInt(filters.year_to));
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error filtering posts server-side:', error);
      throw error;
    }

    // Преобразовать данные
    const transformedData = (data || []).map(entry => ({
      id: entry.id,
      title: entry.title,
      content: entry.content,
      author_handle: entry.profiles?.handle || 'Unknown',
      author_avatar_url: entry.profiles?.avatar_url || '',
      car_brand: entry.cars?.brand || 'Unknown',
      car_model: entry.cars?.model || 'Unknown',
      car_year: entry.cars?.year || 0,
      car_name: entry.cars?.name || '',
      media_preview: '', // Будет заполнено отдельно
      likes_count: 0, // Будет заполнено отдельно
      comments_count: 0, // Будет заполнено отдельно
      publish_date: entry.publish_date
    }));

    return transformedData;
  } catch (error) {
    console.error('Error in filterPostsServerSide:', error);
    throw error;
  }
}

/**
 * Проверить, есть ли активные фильтры
 */
export function hasActiveFilters(filters: FilterState): boolean {
  return !!(filters.car_brand || filters.car_model || filters.topic || filters.year_from || filters.year_to);
}

/**
 * Получить количество активных фильтров
 */
export function getActiveFiltersCount(filters: FilterState): number {
  let count = 0;
  if (filters.car_brand) count++;
  if (filters.car_model) count++;
  if (filters.topic) count++;
  if (filters.year_from) count++;
  if (filters.year_to) count++;
  return count;
}

/**
 * Очистить все фильтры
 */
export function clearFilters(): FilterState {
  return {
    car_brand: '',
    car_model: '',
    topic: '',
    year_from: '',
    year_to: ''
  };
}

/**
 * Создать URL параметры из фильтров
 */
export function createFilterParams(filters: FilterState): URLSearchParams {
  const params = new URLSearchParams();
  
  if (filters.car_brand) params.set('brand', filters.car_brand);
  if (filters.car_model) params.set('model', filters.car_model);
  if (filters.topic) params.set('topic', filters.topic);
  if (filters.year_from) params.set('year_from', filters.year_from);
  if (filters.year_to) params.set('year_to', filters.year_to);
  
  return params;
}

/**
 * Создать фильтры из URL параметров
 */
export function createFiltersFromParams(searchParams: URLSearchParams): FilterState {
  return {
    car_brand: searchParams.get('brand') || '',
    car_model: searchParams.get('model') || '',
    topic: searchParams.get('topic') || '',
    year_from: searchParams.get('year_from') || '',
    year_to: searchParams.get('year_to') || ''
  };
}

/**
 * Валидация фильтров
 */
export function validateFilters(filters: FilterState): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Проверить диапазон годов
  if (filters.year_from && filters.year_to) {
    const yearFrom = parseInt(filters.year_from);
    const yearTo = parseInt(filters.year_to);
    
    if (yearFrom > yearTo) {
      errors.push('Год "от" не может быть больше года "до"');
    }
  }

  // Проверить, что год не в будущем
  const currentYear = new Date().getFullYear();
  if (filters.year_from && parseInt(filters.year_from) > currentYear) {
    errors.push('Год "от" не может быть в будущем');
  }
  if (filters.year_to && parseInt(filters.year_to) > currentYear) {
    errors.push('Год "до" не может быть в будущем');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
