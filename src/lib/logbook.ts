import { supabase } from './supabaseClient';
import { LogbookEntry, LogbookMedia, Comment, PostLike, CommentLike } from './types';
import { logSb } from './supabaseDebug';

const UUID_RX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface CreateLogbookEntryData {
  car_id: string; // Обязательное поле согласно новым RLS политикам
  title: string;
  content: string;
  topic?: string;
  allow_comments?: boolean;
}

export interface UpdateLogbookEntryData extends Partial<CreateLogbookEntryData> {
  id: string;
}

export interface CreateCommentData {
  entry_id: string;
  text: string;
  parent_id?: string;
}

export interface UpdateCommentData {
  id: string;
  text: string;
}

// Logbook Entries
export interface ListEntriesOptions {
  limit?: number;
  cursor?: string;
}

export async function listEntriesByCar(carId: string, options: ListEntriesOptions = {}): Promise<LogbookEntry[]> {
  try {
    let query = supabase
      .from('logbook_entries')
      .select('*')
      .eq('car_id', carId)
      .order('publish_date', { ascending: false });

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.cursor) {
      query = query.lt('publish_date', options.cursor);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching logbook entries:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in listEntriesByCar:', error);
    throw error;
  }
}

export async function getLogbookEntries(carId: string): Promise<LogbookEntry[]> {
  return listEntriesByCar(carId);
}

export async function getLogbookEntry(entryId: string) {
  try {
    if (!UUID_RX.test(entryId)) return null;

    // 1) Базовая запись без вложений
    const entryResp = await supabase
      .from('logbook_entries')
      .select(`
        id, car_id, author_id,
        title, content, topic,
        mileage, mileage_unit, cost, currency,
        allow_comments, pin_to_car, publish_date,
        created_at, updated_at
      `)
      .eq('id', entryId)
      .maybeSingle();

    logSb('getLogbookEntry:entry', entryResp);

    if (entryResp.error || !entryResp.data) return null;
    const entry = entryResp.data;

    // Проверяем что car_id не null (согласно новым RLS политикам)
    if (!entry.car_id) {
      console.error('Logbook entry missing car_id:', entryId);
      return null;
    }

    // 2) Автор
    const authorResp = await supabase
      .from('profiles')
      .select('id, handle, avatar_url, display_name, name')
      .eq('id', entry.author_id)
      .maybeSingle();

    logSb('getLogbookEntry:author', authorResp);

    // 3) Машина
    const carResp = await supabase
      .from('cars')
      .select('id, brand, model, year, name')
      .eq('id', entry.car_id)
      .maybeSingle();

    logSb('getLogbookEntry:car', carResp);

    // 4) Медиа
    const mediaResp = await supabase
      .from('logbook_media')
      .select('id, storage_path, sort, created_at')
      .eq('entry_id', entry.id)
      .order('sort', { ascending: true });

    logSb('getLogbookEntry:media', mediaResp);

    return {
      ...entry,
      author: authorResp?.data || null,
      car: carResp?.data || null,
      media: Array.isArray(mediaResp?.data) ? mediaResp.data : [],
    };
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error('[getLogbookEntry] Unexpected:', {
      message: err?.message,
      code: err?.code,
      name: err?.name,
    });
    return null;
  }
}

export async function createLogbookEntry(
  entryData: CreateLogbookEntryData, 
  authorId: string
): Promise<LogbookEntry> {
  try {
    // Проверяем что car_id обязателен согласно новым RLS политикам
    if (!entryData.car_id) {
      throw new Error('car_id is required for logbook entries');
    }

    const { data, error } = await supabase
      .from('logbook_entries')
      .insert({
        ...entryData,
        author_id: authorId
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating logbook entry:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in createLogbookEntry:', error);
    throw error;
  }
}

export async function updateLogbookEntry(entryData: UpdateLogbookEntryData): Promise<LogbookEntry> {
  try {
    const { id, ...updateData } = entryData;
    
    // Проверяем что car_id не удаляется (согласно новым RLS политикам)
    if (updateData.car_id === null || updateData.car_id === undefined) {
      throw new Error('car_id cannot be null or undefined');
    }
    
    const { data, error } = await supabase
      .from('logbook_entries')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating logbook entry:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in updateLogbookEntry:', error);
    throw error;
  }
}

export async function deleteLogbookEntry(entryId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('logbook_entries')
      .delete()
      .eq('id', entryId);

    if (error) {
      console.error('Error deleting logbook entry:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in deleteLogbookEntry:', error);
    throw error;
  }
}

// Logbook Media
export async function getLogbookMedia(entryId: string): Promise<LogbookMedia[]> {
  try {
    const { data, error } = await supabase
      .from('logbook_media')
      .select('*')
      .eq('entry_id', entryId)
      .order('sort', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching logbook media:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getLogbookMedia:', error);
    throw error;
  }
}

export async function uploadLogbookMedia(
  entryId: string, 
  file: File, 
  authorId: string
): Promise<LogbookMedia> {
  try {
    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `${authorId}/${entryId}/${fileName}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('logbook')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Error uploading media:', uploadError);
      throw uploadError;
    }

    // Get the next sort order
    const { data: media } = await supabase
      .from('logbook_media')
      .select('sort')
      .eq('entry_id', entryId)
      .order('sort', { ascending: false })
      .limit(1);

    const nextSort = media && media.length > 0 ? media[0].sort + 1 : 0;

    // Save media record
    const { data, error } = await supabase
      .from('logbook_media')
      .insert({
        entry_id: entryId,
        storage_path: filePath,
        sort: nextSort
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving media record:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in uploadLogbookMedia:', error);
    throw error;
  }
}

export async function addMedia(entryId: string, files: File[], authorId: string): Promise<LogbookMedia[]> {
  try {
    const uploadPromises = files.map(file => uploadLogbookMedia(entryId, file, authorId));
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Error in addMedia:', error);
    throw error;
  }
}

export async function listMedia(entryId: string): Promise<LogbookMedia[]> {
  return getLogbookMedia(entryId);
}

export async function deleteLogbookMedia(mediaId: string): Promise<void> {
  try {
    // Get media info first
    const { data: media, error: fetchError } = await supabase
      .from('logbook_media')
      .select('storage_path')
      .eq('id', mediaId)
      .single();

    if (fetchError) {
      console.error('Error fetching media info:', fetchError);
      throw fetchError;
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('logbook')
      .remove([media.storage_path]);

    if (storageError) {
      console.error('Error deleting from storage:', storageError);
      // Continue with database deletion even if storage deletion fails
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('logbook_media')
      .delete()
      .eq('id', mediaId);

    if (dbError) {
      console.error('Error deleting media record:', dbError);
      throw dbError;
    }
  } catch (error) {
    console.error('Error in deleteLogbookMedia:', error);
    throw error;
  }
}

export function getLogbookMediaUrl(storagePath: string): string {
  const { data } = supabase.storage
    .from('logbook')
    .getPublicUrl(storagePath);
  
  return data.publicUrl;
}

// Comments
type RawComment = {
  id: string;
  entry_id: string;
  author_id: string;
  parent_id: string | null;
  text: string;
  created_at: string;
  updated_at: string | null;
};

type Profile = {
  id: string;
  handle: string | null;
  avatar_url: string | null;
  display_name: string | null;
  name: string | null;
};

export async function getComments(entryId: string) {
  try {
    // 1) Комменты — без вложений
    const commentsResp = await supabase
      .from('comments')
      .select(
        'id, entry_id, author_id, parent_id, text, created_at, updated_at'
      )
      .eq('entry_id', entryId)
      .order('created_at', { ascending: true });

    logSb('getComments:comments', commentsResp);

    if (commentsResp.error || !Array.isArray(commentsResp.data)) {
      return [];
    }

    const comments = commentsResp.data as RawComment[];
    if (comments.length === 0) return [];

    // 2) Уникальные author_id
    const authorIds = Array.from(new Set(comments.map(c => c.author_id)));

    // 3) Подтянуть профили пачкой
    const profilesResp = await supabase
      .from('profiles')
      .select('id, handle, avatar_url, display_name, name')
      .in('id', authorIds);

    logSb('getComments:profiles', profilesResp);

    const profilesMap = new Map<string, Profile>();
    if (!profilesResp.error && Array.isArray(profilesResp.data)) {
      for (const p of profilesResp.data as Profile[]) {
        profilesMap.set(p.id, p);
      }
    }

    // 4) Смаппить
    const withAuthor = comments.map(c => {
      const profile = profilesMap.get(c.author_id);
      return {
        ...c,
        parent_id: c.parent_id || undefined,
        updated_at: c.updated_at || c.created_at,
        author: profile ? {
          name: profile.name || undefined,
          handle: profile.handle || undefined,
          avatar_url: profile.avatar_url || undefined,
        } : undefined,
      };
    });

    return withAuthor as Comment[];
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error('[getComments] Unexpected:', {
      message: err?.message,
      code: err?.code,
      name: err?.name,
    });
    return [];
  }
}

export async function createComment(
  commentData: CreateCommentData, 
  authorId: string
): Promise<Comment> {
  try {
    const { data, error } = await supabase
      .from('comments')
      .insert({
        ...commentData,
        author_id: authorId
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating comment:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in createComment:', error);
    throw error;
  }
}

export async function updateComment(commentData: UpdateCommentData): Promise<Comment> {
  try {
    const { id, ...updateData } = commentData;
    
    const { data, error } = await supabase
      .from('comments')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating comment:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in updateComment:', error);
    throw error;
  }
}

export async function deleteComment(commentId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in deleteComment:', error);
    throw error;
  }
}

// Likes
export async function getPostLikes(entryId: string): Promise<PostLike[]> {
  try {
    const { data, error } = await supabase
      .from('post_likes')
      .select('*')
      .eq('entry_id', entryId);

    if (error) throw error;
    return data || [];
  } catch (e) {
    console.error('Error in getPostLikes:', e);
    return [];
  }
}

export async function hasLikedPost(entryId: string, userId: string): Promise<boolean> {
  try {
    const { count, error } = await supabase
      .from('post_likes')
      .select('*', { head: true, count: 'exact' })
      .eq('entry_id', entryId)
      .eq('user_id', userId);

    if (error) throw error;
    return (count ?? 0) > 0;
  } catch (e) {
    console.error('Error in hasLikedPost:', e);
    return false;
  }
}

export async function countPostLikes(entryId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('post_likes')
      .select('*', { head: true, count: 'exact' })
      .eq('entry_id', entryId);

    if (error) throw error;
    return count ?? 0;
  } catch (e) {
    console.error('Error in countPostLikes:', e);
    return 0;
  }
}

export async function togglePostLike(entryId: string, userId: string): Promise<boolean> {
  try {
    // Проверяем, есть ли лайк
    const liked = await hasLikedPost(entryId, userId);

    if (liked) {
      const { error } = await supabase
        .from('post_likes')
        .delete()
        .eq('entry_id', entryId)
        .eq('user_id', userId);

      if (error) throw error;
      return false; // стало «не лайкнуто»
    } else {
      const { error } = await supabase
        .from('post_likes')
        .insert({ entry_id: entryId, user_id: userId });

      if (error) throw error;
      return true; // стало «лайкнуто»
    }
  } catch (e) {
    console.error('Error in togglePostLike:', e);
    throw e;
  }
}

export async function getCommentLikes(commentId: string): Promise<CommentLike[]> {
  try {
    const { data, error } = await supabase
      .from('comment_likes')
      .select('*')
      .eq('comment_id', commentId);

    if (error) {
      console.error('Error fetching comment likes:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getCommentLikes:', error);
    throw error;
  }
}

export async function toggleCommentLike(commentId: string, userId: string): Promise<boolean> {
  try {
    // Check if already liked
    const { data: existingLike, error: checkError } = await supabase
      .from('comment_likes')
      .select('*')
      .eq('comment_id', commentId)
      .eq('user_id', userId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking comment like:', checkError);
      throw checkError;
    }

    if (existingLike) {
      // Unlike
      const { error: deleteError } = await supabase
        .from('comment_likes')
        .delete()
        .eq('comment_id', commentId)
        .eq('user_id', userId);

      if (deleteError) {
        console.error('Error removing comment like:', deleteError);
        throw deleteError;
      }

      return false; // Now unliked
    } else {
      // Like
      const { error: insertError } = await supabase
        .from('comment_likes')
        .insert({
          comment_id: commentId,
          user_id: userId
        });

      if (insertError) {
        console.error('Error adding comment like:', insertError);
        throw insertError;
      }

      return true; // Now liked
    }
  } catch (error) {
    console.error('Error in toggleCommentLike:', error);
    throw error;
  }
}

// Convenience functions for UI
export async function likePost(entryId: string, userId: string): Promise<void> {
  await togglePostLike(entryId, userId);
}

export async function unlikePost(entryId: string, userId: string): Promise<void> {
  await togglePostLike(entryId, userId);
}

export async function likeComment(commentId: string, userId: string): Promise<void> {
  await toggleCommentLike(commentId, userId);
}

export async function unlikeComment(commentId: string, userId: string): Promise<void> {
  await toggleCommentLike(commentId, userId);
}

export async function hasLikedComment(commentId: string, userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('comment_likes')
      .select('*')
      .eq('comment_id', commentId)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking comment like:', error);
      throw error;
    }

    return !!data;
  } catch (error) {
    console.error('Error in hasLikedComment:', error);
    return false;
  }
}

export async function countCommentLikes(commentId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('comment_likes')
      .select('*', { count: 'exact', head: true })
      .eq('comment_id', commentId);

    if (error) {
      console.error('Error counting comment likes:', error);
      throw error;
    }

    return count || 0;
  } catch (error) {
    console.error('Error in countCommentLikes:', error);
    return 0;
  }
}

// Comments convenience functions
export async function listComments(entryId: string): Promise<Comment[]> {
  return getComments(entryId);
}

export async function addComment(commentData: CreateCommentData, authorId: string): Promise<Comment> {
  return createComment(commentData, authorId);
}
