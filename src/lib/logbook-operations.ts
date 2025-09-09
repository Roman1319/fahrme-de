// Supabase-based logbook operations

import { supabase } from './supabaseClient';

export interface LogbookEntry {
  id: string;
  car_id: string;
  author_id: string;
  title: string;
  content: string;
  allow_comments: boolean;
  publish_date: string;
  created_at: string;
  updated_at: string;
  author?: {
    name?: string;
    handle?: string;
    avatar_url?: string;
  };
}

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
        *,
        author:profiles!logbook_entries_author_id_fkey(name, handle, avatar_url)
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

    return data;
  } catch (error) {
    console.error('Error in getLogbookEntry:', error);
    return null;
  }
}

export async function toggleLogbookEntryLike(entryId: string, userId: string): Promise<boolean> {
  try {
    // Check if already liked
    const { data: existing } = await supabase
      .from('post_likes')
      .select('id')
      .eq('entry_id', entryId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      // Unlike
      const { error } = await supabase
        .from('post_likes')
        .delete()
        .eq('entry_id', entryId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error unliking entry:', error);
        return false;
      }
    } else {
      // Like
      const { error } = await supabase
        .from('post_likes')
        .insert({
          entry_id: entryId,
          user_id: userId
        });

      if (error) {
        console.error('Error liking entry:', error);
        return false;
      }
    }

    return true;
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
      console.error('Error getting entry likes:', error);
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
      .select('id')
      .eq('entry_id', entryId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error checking entry like:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Error in hasUserLikedLogbookEntry:', error);
    return false;
  }
}
