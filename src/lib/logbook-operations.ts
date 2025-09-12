// Supabase-based logbook operations

import { supabase } from './supabaseClient';
import { LogbookEntry } from './types';

export async function deleteLogbookEntry(entryId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('logbook_entries')
      .delete()
      .eq('id', entryId);

    if (error) {
      console.error('Error deleting logbook entry:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteLogbookEntry:', error);
    return false;
  }
}

export async function getLogbookEntry(entryId: string): Promise<LogbookEntry | null> {
  try {
    const { data, error } = await supabase
      .from('logbook_entries')
      .select(`
        id, car_id, author_id,
        title, content, topic,
        mileage, mileage_unit, cost, currency,
        allow_comments, pin_to_car, publish_date,
        created_at, updated_at
      `)
      .eq('id', entryId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Entry not found
      }
      console.error('Error fetching logbook entry:', error);
      return null;
    }

    // Batch load author profile
    let author = undefined;
    if (data.author_id) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('name, handle, avatar_url')
        .eq('id', data.author_id)
        .single();

      if (!profileError && profile) {
        author = profile;
      }
    }

    return {
      ...data,
      author: author ? {
        id: data.author_id,
        email: '', // Not available in this query
        name: author.name || null,
        handle: author.handle || null,
        avatar_url: author.avatar_url || null,
        display_name: null, // Not available in this query
        about: null,
        country: null,
        city: null,
        gender: null,
        birth_date: null,
        created_at: '',
        updated_at: ''
      } : null
    } as LogbookEntry;
  } catch (error) {
    console.error('Error in getLogbookEntry:', error);
    return null;
  }
}

export async function toggleLogbookEntryLike(entryId: string, userId: string): Promise<boolean> {
  try {
    // Check if user already liked this entry
    const { data: existingLike, error: checkError } = await supabase
      .from('post_likes')
      .select('user_id')
      .eq('entry_id', entryId)
      .eq('user_id', userId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing like:', checkError);
      return false;
    }

    if (existingLike) {
      // User already liked, remove the like
      const { error: deleteError } = await supabase
        .from('post_likes')
        .delete()
        .eq('entry_id', entryId)
        .eq('user_id', userId);

      if (deleteError) {
        console.error('Error removing like:', deleteError);
        return false;
      }
      return false; // Like removed
    } else {
      // User hasn't liked yet, add the like
      const { error: insertError } = await supabase
        .from('post_likes')
        .insert({
          entry_id: entryId,
          user_id: userId
        });

      if (insertError) {
        console.error('Error adding like:', insertError);
        return false;
      }
      return true; // Like added
    }
  } catch (error) {
    console.error('Error in toggleLogbookEntryLike:', error);
    return false;
  }
}

export async function getLogbookEntryLikes(entryId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('post_likes')
      .select('*', { count: 'exact', head: true })
      .eq('entry_id', entryId);

    if (error) {
      console.error('Error getting likes count:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Error in getLogbookEntryLikes:', error);
    return 0;
  }
}

export async function hasUserLikedLogbookEntry(entryId: string, userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('post_likes')
      .select('user_id')
      .eq('entry_id', entryId)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return false; // No like found
      }
      console.error('Error checking user like:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Error in hasUserLikedLogbookEntry:', error);
    return false;
  }
}
