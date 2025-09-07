import { supabase } from './supabaseClient';

export interface FeedEntry {
  id: string;
  car_id: string;
  author_id: string;
  title: string;
  content: string;
  allow_comments: boolean;
  publish_date: string;
  created_at: string;
  updated_at: string;
  // Joined data
  author_handle: string;
  author_avatar_url: string;
  car_brand: string;
  car_model: string;
  car_year: number;
  car_name: string;
  // Aggregated data
  like_count: number;
  comment_count: number;
}

export interface FeedFilters {
  limit?: number;
  offset?: number;
  car_brand?: string;
  car_model?: string;
  year_from?: number;
  year_to?: number;
}

export async function getExploreFeed(filters: FeedFilters = {}): Promise<FeedEntry[]> {
  try {
    const {
      limit = 20,
      offset = 0,
      car_brand,
      car_model,
      year_from,
      year_to
    } = filters;

    let query = supabase
      .from('logbook_entries')
      .select(`
        *,
        profiles!logbook_entries_author_id_fkey(handle, avatar_url),
        cars!logbook_entries_car_id_fkey(brand, model, year, name)
      `)
      .order('publish_date', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (car_brand) {
      query = query.eq('cars.brand', car_brand);
    }
    if (car_model) {
      query = query.eq('cars.model', car_model);
    }
    if (year_from) {
      query = query.gte('cars.year', year_from);
    }
    if (year_to) {
      query = query.lte('cars.year', year_to);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching explore feed:', error);
      throw error;
    }

    // Transform the data to match our interface
    const transformedData = (data || []).map(entry => ({
      id: entry.id,
      car_id: entry.car_id,
      author_id: entry.author_id,
      title: entry.title,
      content: entry.content,
      allow_comments: entry.allow_comments,
      publish_date: entry.publish_date,
      created_at: entry.created_at,
      updated_at: entry.updated_at,
      author_handle: entry.profiles?.handle || 'Unknown',
      author_avatar_url: entry.profiles?.avatar_url || '',
      car_brand: entry.cars?.brand || 'Unknown',
      car_model: entry.cars?.model || 'Unknown',
      car_year: entry.cars?.year || 0,
      car_name: entry.cars?.name || '',
      like_count: 0, // Will be populated separately
      comment_count: 0 // Will be populated separately
    }));

    // Get like and comment counts for each entry
    const entryIds = transformedData.map(entry => entry.id);
    
    if (entryIds.length > 0) {
      // Get like counts
      const { data: likeCounts } = await supabase
        .from('post_likes')
        .select('entry_id')
        .in('entry_id', entryIds);

      // Get comment counts
      const { data: commentCounts } = await supabase
        .from('comments')
        .select('entry_id')
        .in('entry_id', entryIds);

      // Aggregate counts
      const likeCountMap = new Map<string, number>();
      const commentCountMap = new Map<string, number>();

      likeCounts?.forEach(like => {
        const count = likeCountMap.get(like.entry_id) || 0;
        likeCountMap.set(like.entry_id, count + 1);
      });

      commentCounts?.forEach(comment => {
        const count = commentCountMap.get(comment.entry_id) || 0;
        commentCountMap.set(comment.entry_id, count + 1);
      });

      // Update the data with counts
      transformedData.forEach(entry => {
        entry.like_count = likeCountMap.get(entry.id) || 0;
        entry.comment_count = commentCountMap.get(entry.id) || 0;
      });
    }

    return transformedData;
  } catch (error) {
    console.error('Error in getExploreFeed:', error);
    throw error;
  }
}

export async function getCarBrands(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('cars')
      .select('brand')
      .order('brand');

    if (error) {
      console.error('Error fetching car brands:', error);
      throw error;
    }

    // Get unique brands
    const brands = [...new Set(data?.map(car => car.brand) || [])];
    return brands;
  } catch (error) {
    console.error('Error in getCarBrands:', error);
    throw error;
  }
}

export async function getCarModels(brand?: string): Promise<string[]> {
  try {
    let query = supabase
      .from('cars')
      .select('model')
      .order('model');

    if (brand) {
      query = query.eq('brand', brand);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching car models:', error);
      throw error;
    }

    // Get unique models
    const models = [...new Set(data?.map(car => car.model) || [])];
    return models;
  } catch (error) {
    console.error('Error in getCarModels:', error);
    throw error;
  }
}

export async function getYearRange(): Promise<{ min: number; max: number }> {
  try {
    const { data, error } = await supabase
      .from('cars')
      .select('year')
      .order('year');

    if (error) {
      console.error('Error fetching year range:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return { min: 1900, max: new Date().getFullYear() };
    }

    const years = data.map(car => car.year);
    return {
      min: Math.min(...years),
      max: Math.max(...years)
    };
  } catch (error) {
    console.error('Error in getYearRange:', error);
    throw error;
  }
}
