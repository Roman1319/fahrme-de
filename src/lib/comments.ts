// Supabase-based comments and logbook operations

import { supabase } from './supabaseClient';

export interface Comment {
  id: string;
  entry_id: string;
  author_id: string;
  parent_id?: string;
  text: string;
  created_at: string;
  updated_at: string;
  author?: {
    name?: string;
    handle?: string;
    avatar_url?: string;
  };
}

export async function addComment(entryId: string, text: string, authorId: string, parentId?: string): Promise<Comment | null> {
  try {
    const { data, error } = await supabase
      .from('comments')
      .insert({
        entry_id: entryId,
        author_id: authorId,
        text,
        parent_id: parentId || null
      })
      .select(`
        *,
        author:profiles!comments_author_id_fkey(name, handle, avatar_url)
      `)
      .single();

    if (error) {
      console.error('Error adding comment:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in addComment:', error);
    return null;
  }
}

export async function getComments(entryId: string): Promise<Comment[]> {
  try {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        author:profiles!comments_author_id_fkey(name, handle, avatar_url)
      `)
      .eq('entry_id', entryId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getComments:', error);
    return [];
  }
}

export async function editComment(commentId: string, text: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('comments')
      .update({ text })
      .eq('id', commentId);

    if (error) {
      console.error('Error editing comment:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in editComment:', error);
    return false;
  }
}

export async function deleteComment(commentId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      console.error('Error deleting comment:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteComment:', error);
    return false;
  }
}

export async function likeComment(commentId: string, userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('comment_likes')
      .insert({
        comment_id: commentId,
        user_id: userId
      });

    if (error) {
      // If already liked, that's fine
      if (error.code === '23505') {
        return true;
      }
      console.error('Error liking comment:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in likeComment:', error);
    return false;
  }
}

export async function unlikeComment(commentId: string, userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('comment_likes')
      .delete()
      .eq('comment_id', commentId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error unliking comment:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in unlikeComment:', error);
    return false;
  }
}

export async function getCommentLikes(commentId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('comment_likes')
      .select('*', { count: 'exact', head: true })
      .eq('comment_id', commentId);

    if (error) {
      console.error('Error getting comment likes:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Error in getCommentLikes:', error);
    return 0;
  }
}

export async function hasUserLikedComment(commentId: string, userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('comment_likes')
      .select('id')
      .eq('comment_id', commentId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error checking comment like:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Error in hasUserLikedComment:', error);
    return false;
  }
}
