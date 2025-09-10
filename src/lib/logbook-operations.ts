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
      .select('*')
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
      author
    };
  } catch (error) {
    console.error('Error in getLogbookEntry:', error);
    return null;
  }
}

export async function toggleLogbookEntryLike(entryId: string, userId: string): Promise<boolean> {
  // Временно отключено из-за проблем с post_likes таблицей
  return false;
}

export async function getLogbookEntryLikes(entryId: string): Promise<number> {
  // Временно отключено из-за проблем с post_likes таблицей
  return 0;
}

export async function hasUserLikedLogbookEntry(entryId: string, userId: string): Promise<boolean> {
  // Временно отключено из-за проблем с post_likes таблицей
  return false;
}
