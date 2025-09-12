import { supabase } from './supabaseClient';

export interface FeedEntry {
  id: string;
  car_id: string;
  author_id: string;
  title: string;
  content: string;
  topic?: string;
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

// RPC Feed interfaces
export interface RPCFeedPost {
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
  liked_by_me?: boolean; // Only for personal feed
  publish_date: string;
}

export interface FeedFilters {
  limit?: number;
  offset?: number;
  car_brand?: string;
  car_model?: string;
  year_from?: number;
  year_to?: number;
  topic?: string;
}

// RPC-based feed functions
export async function getRPCExploreFeed(limit: number = 20, offset: number = 0): Promise<RPCFeedPost[]> {
  try {
    const { data, error } = await supabase.rpc('feed_explore', {
      p_limit: limit,
      p_offset: offset
    });

    if (error) {
      console.error('Error fetching RPC explore feed:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getRPCExploreFeed:', error);
    throw error;
  }
}

export async function getRPCPersonalFeed(limit: number = 20, offset: number = 0): Promise<RPCFeedPost[]> {
  try {
    const { data, error } = await supabase.rpc('feed_personal', {
      p_limit: limit,
      p_offset: offset
    });

    if (error) {
      console.error('Error fetching RPC personal feed:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getRPCPersonalFeed:', error);
    throw error;
  }
}

export async function getExploreFeed(filters: FeedFilters = {}): Promise<FeedEntry[]> {
  try {
    const {
      limit = 20,
      offset = 0,
      car_brand,
      car_model,
      year_from,
      year_to,
      topic
    } = filters;

    let query = supabase
      .from('logbook_entries')
      .select(`
        *,
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
    if (topic) {
      query = query.eq('topic', topic);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching explore feed:', error);
      throw error;
    }

    // Batch load profiles
    const authorIds = [...new Set((data || []).map(entry => entry.author_id))];
    const profilesMap = new Map<string, { handle: string; avatar_url: string }>();
    
    if (authorIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, handle, avatar_url')
        .in('id', authorIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        // Continue without profiles data
      } else {
        profiles?.forEach(profile => {
          profilesMap.set(profile.id, {
            handle: profile.handle || 'Unknown',
            avatar_url: profile.avatar_url || ''
          });
        });
      }
    }

    // Transform the data to match our interface
    const transformedData = (data || []).map(entry => {
      const profile = profilesMap.get(entry.author_id);
      return {
        id: entry.id,
        car_id: entry.car_id,
        author_id: entry.author_id,
        title: entry.title,
        content: entry.content,
        topic: entry.topic,
        allow_comments: entry.allow_comments,
        publish_date: entry.publish_date,
        created_at: entry.created_at,
        updated_at: entry.updated_at,
        author_handle: profile?.handle || 'Unknown',
        author_avatar_url: profile?.avatar_url || '',
        car_brand: entry.cars?.brand || 'Unknown',
        car_model: entry.cars?.model || 'Unknown',
        car_year: entry.cars?.year || 0,
        car_name: entry.cars?.name || '',
        like_count: 0, // Will be populated separately
        comment_count: 0 // Will be populated separately
      };
    });

    // Временно отключено из-за проблем с post_likes таблицей
    // Get like and comment counts for each entry
    const entryIds = transformedData.map(entry => entry.id);
    
    if (entryIds.length > 0) {
      // Get comment counts only
      const { data: commentCounts } = await supabase
        .from('comments')
        .select('entry_id')
        .in('entry_id', entryIds);

      // Aggregate counts
      const commentCountMap = new Map<string, number>();

      commentCounts?.forEach(comment => {
        const count = commentCountMap.get(comment.entry_id) || 0;
        commentCountMap.set(comment.entry_id, count + 1);
      });

      // Update the data with counts
      transformedData.forEach(entry => {
        entry.like_count = 0; // Временно отключено
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
      .from('brands')
      .select('name')
      .order('name');

    if (error) {
      console.error('Error fetching car brands:', error);
      throw error;
    }

    return data?.map(brand => brand.name) || [];
  } catch (error) {
    console.error('Error in getCarBrands:', error);
    throw error;
  }
}

export async function getCarModels(brand?: string): Promise<string[]> {
  try {
    let query;
    
    if (brand) {
      query = supabase
        .from('car_models')
        .select(`
          name,
          brands!inner(name)
        `)
        .eq('brands.name', brand)
        .order('name');
    } else {
      query = supabase
        .from('car_models')
        .select('name')
        .order('name');
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching car models:', error);
      throw error;
    }

    return data?.map(model => model.name) || [];
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
