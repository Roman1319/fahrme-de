import { supabase } from './supabaseClient';

export interface Brand {
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

/**
 * Получает все бренды автомобилей
 */
export async function getBrands(): Promise<Brand[]> {
  try {
    const { data, error } = await supabase
      .from('brands')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching brands:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getBrands:', error);
    throw error;
  }
}

/**
 * Получает модели для конкретного бренда
 */
export async function getModelsByBrand(brandId: number): Promise<CarModel[]> {
  try {
    const { data, error } = await supabase
      .from('car_models')
      .select('*')
      .eq('brand_id', brandId)
      .order('name');

    if (error) {
      console.error('Error fetching models:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getModelsByBrand:', error);
    throw error;
  }
}

/**
 * Получает модели по названию бренда
 */
export async function getModelsByBrandName(brandName: string): Promise<CarModel[]> {
  try {
    const { data, error } = await supabase
      .from('car_models')
      .select(`
        *,
        brands!inner(name)
      `)
      .eq('brands.name', brandName)
      .order('name');

    if (error) {
      console.error('Error fetching models by brand name:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getModelsByBrandName:', error);
    throw error;
  }
}

/**
 * Поиск брендов по названию
 */
export async function searchBrands(query: string): Promise<Brand[]> {
  try {
    const { data, error } = await supabase
      .from('brands')
      .select('*')
      .ilike('name', `%${query}%`)
      .order('name')
      .limit(20);

    if (error) {
      console.error('Error searching brands:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in searchBrands:', error);
    throw error;
  }
}

/**
 * Поиск моделей по названию
 */
export async function searchModels(query: string, brandId?: number): Promise<CarModel[]> {
  try {
    let supabaseQuery = supabase
      .from('car_models')
      .select('*')
      .ilike('name', `%${query}%`)
      .order('name')
      .limit(50);

    if (brandId) {
      supabaseQuery = supabaseQuery.eq('brand_id', brandId);
    }

    const { data, error } = await supabaseQuery;

    if (error) {
      console.error('Error searching models:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in searchModels:', error);
    throw error;
  }
}

/**
 * Получает бренд по ID
 */
export async function getBrandById(id: number): Promise<Brand | null> {
  try {
    const { data, error } = await supabase
      .from('brands')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Brand not found
      }
      console.error('Error fetching brand by ID:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in getBrandById:', error);
    throw error;
  }
}

/**
 * Получает модель по ID
 */
export async function getModelById(id: number): Promise<CarModel | null> {
  try {
    const { data, error } = await supabase
      .from('car_models')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Model not found
      }
      console.error('Error fetching model by ID:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in getModelById:', error);
    throw error;
  }
}

/**
 * Проверяет, существует ли комбинация бренд-модель
 */
export async function isValidBrandModel(brandName: string, modelName: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('car_models')
      .select(`
        id,
        brands!inner(name)
      `)
      .eq('brands.name', brandName)
      .eq('name', modelName)
      .limit(1);

    if (error) {
      console.error('Error checking brand-model combination:', error);
      throw error;
    }

    return (data && data.length > 0);
  } catch (error) {
    console.error('Error in isValidBrandModel:', error);
    throw error;
  }
}

/**
 * Получает статистику по брендам и моделям
 */
export async function getCarDataStats(): Promise<{
  totalBrands: number;
  totalModels: number;
  brandsWithModels: number;
}> {
  try {
    const [brandsResult, modelsResult, brandsWithModelsResult] = await Promise.all([
      supabase.from('brands').select('*', { count: 'exact', head: true }),
      supabase.from('car_models').select('*', { count: 'exact', head: true }),
      supabase.from('car_models').select('brand_id')
    ]);

    if (brandsResult.error) throw brandsResult.error;
    if (modelsResult.error) throw modelsResult.error;
    if (brandsWithModelsResult.error) throw brandsWithModelsResult.error;

    // Подсчитываем уникальные brand_id
    const uniqueBrandIds = new Set(brandsWithModelsResult.data?.map(item => item.brand_id) || []);

    return {
      totalBrands: brandsResult.count || 0,
      totalModels: modelsResult.count || 0,
      brandsWithModels: uniqueBrandIds.size
    };
  } catch (error) {
    console.error('Error in getCarDataStats:', error);
    throw error;
  }
}
