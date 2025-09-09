// Logbook detail page utilities - Supabase version
import { LogbookEntry, Comment } from './types';
import { 
  getLogbookEntry, 
  updateLogbookEntry as updateLogbookEntryInSupabase, 
  deleteLogbookEntry as deleteLogbookEntryInSupabase,
  getComments as getCommentsFromSupabase,
  createComment,
  updateComment,
  deleteComment as deleteCommentInSupabase,
  toggleCommentLike,
  hasLikedComment,
  countCommentLikes,
  togglePostLike,
  hasLikedPost,
  countPostLikes
} from './logbook';

// Like system for logbook entries - Supabase version
export async function hasUserLikedLogbookEntry(entryId: string, userId: string): Promise<boolean> {
  try {
    return await hasLikedPost(entryId, userId);
  } catch (error) {
    console.error('Error checking if user liked entry:', error);
    return false;
  }
}

export async function toggleLogbookEntryLike(entryId: string, userId: string): Promise<boolean> {
  try {
    return await togglePostLike(entryId, userId);
  } catch (error) {
    console.error('Error toggling entry like:', error);
    return false;
  }
}

export async function getLogbookEntryLikes(entryId: string): Promise<number> {
  try {
    return await countPostLikes(entryId);
  } catch (error) {
    console.error('Error getting entry likes count:', error);
    return 0;
  }
}

// Comment system for logbook entries - Supabase version
export async function getCommentsForEntry(entryId: string): Promise<Comment[]> {
  try {
    return await getCommentsFromSupabase(entryId);
  } catch (error) {
    console.error('Error getting comments:', error);
    return [];
  }
}

export async function addCommentToEntry(
  entryId: string, 
  comment: Omit<Comment, 'id' | 'created_at' | 'updated_at' | 'author_id'>,
  authorId: string
): Promise<Comment> {
  try {
    return await createComment({
      entry_id: entryId,
      text: comment.text,
      parent_id: comment.parent_id
    }, authorId);
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
}

export async function editCommentInEntry(entryId: string, commentId: string, newText: string): Promise<boolean> {
  try {
    await updateComment({
      id: commentId,
      text: newText
    });
    return true;
  } catch (error) {
    console.error('Error editing comment:', error);
    return false;
  }
}

export async function deleteCommentFromEntry(entryId: string, commentId: string): Promise<boolean> {
  try {
    await deleteCommentInSupabase(commentId);
    return true;
  } catch (error) {
    console.error('Error deleting comment:', error);
    return false;
  }
}

export async function likeCommentInEntry(entryId: string, commentId: string, userId: string): Promise<boolean> {
  try {
    return await toggleCommentLike(commentId, userId);
  } catch (error) {
    console.error('Error liking comment:', error);
    return false;
  }
}

// Build comment tree structure
export function buildCommentTree(comments: Comment[]): Comment[] {
  const commentMap = new Map<string, Comment & { replies: Comment[] }>();
  const rootComments: (Comment & { replies: Comment[] })[] = [];

  // First pass: create comment nodes
  comments.forEach(comment => {
    commentMap.set(comment.id, { ...comment, replies: [] });
  });

  // Second pass: build tree structure
  comments.forEach(comment => {
    const commentNode = commentMap.get(comment.id)!;
    
    if (comment.parent_id) {
      const parent = commentMap.get(comment.parent_id);
      if (parent) {
        parent.replies.push(commentNode);
      }
    } else {
      rootComments.push(commentNode);
    }
  });

  return rootComments;
}

// Entry utilities - Supabase version
export async function getLogbookEntryById(entryId: string): Promise<LogbookEntry | null> {
  try {
    return await getLogbookEntry(entryId);
  } catch (error) {
    console.error('Error getting logbook entry:', error);
    return null;
  }
}

export async function updateLogbookEntryById(entryId: string, updates: Partial<LogbookEntry>): Promise<boolean> {
  try {
    await updateLogbookEntryInSupabase({
      id: entryId,
      ...updates
    });
    return true;
  } catch (error) {
    console.error('Error updating logbook entry:', error);
    return false;
  }
}

export async function deleteLogbookEntryById(entryId: string): Promise<boolean> {
  try {
    await deleteLogbookEntryInSupabase(entryId);
    return true;
  } catch (error) {
    console.error('Error deleting logbook entry:', error);
    return false;
  }
}

// Check if user is entry owner
export function isEntryOwner(entry: LogbookEntry, userId: string): boolean {
  return entry.author_id === userId;
}

// Backward compatibility functions (deprecated - use Supabase functions directly)
export const getComments = getCommentsForEntry;
export const addComment = addCommentToEntry;
export const editComment = editCommentInEntry;
export const deleteComment = deleteCommentFromEntry;
export const likeComment = likeCommentInEntry;
export const updateLogbookEntry = updateLogbookEntryById;
export const deleteLogbookEntry = deleteLogbookEntryById;
// Note: getLogbookEntryById is already exported above
