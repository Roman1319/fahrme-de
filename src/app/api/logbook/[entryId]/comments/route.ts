import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';

export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  { params }: { params: { entryId: string } }
) {
  const res = NextResponse.json(null, { status: 200 });

  try {
    const supabase = createSupabaseServerClient(req, res);
    const { entryId } = params;

    if (!entryId) {
      return NextResponse.json({ error: 'Missing entryId' }, { status: 400 });
    }

    // Get comments with author info and likes
    const { data: comments, error } = await supabase
      .from('comments')
      .select(`
        id,
        entry_id,
        author_id,
        parent_id,
        text,
        created_at,
        updated_at,
        profiles!comments_author_id_fkey (
          id,
          handle,
          avatar_url
        )
      `)
      .eq('entry_id', entryId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
      return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
    }

    // Get likes count for each comment
    const commentIds = comments?.map(c => c.id) || [];
    let likesData: { comment_id: string; count: number; liked_by_me: boolean }[] = [];

    if (commentIds.length > 0) {
      const { data: likes, error: likesError } = await supabase
        .from('comment_likes')
        .select('comment_id, user_id')
        .in('comment_id', commentIds);

      if (!likesError && likes) {
        // Get current user for liked_by_me check
        const { data: { user } } = await supabase.auth.getUser();
        
        likesData = commentIds.map(commentId => {
          const commentLikes = likes.filter(like => like.comment_id === commentId);
          return {
            comment_id: commentId,
            count: commentLikes.length,
            liked_by_me: user ? commentLikes.some(like => like.user_id === user.id) : false
          };
        });
      }
    }

    // Combine comments with likes data
    const commentsWithLikes = comments?.map(comment => {
      const likesInfo = likesData.find(l => l.comment_id === comment.id);
      return {
        ...comment,
        likes_count: likesInfo?.count || 0,
        liked_by_me: likesInfo?.liked_by_me || false
      };
    }) || [];

    return NextResponse.json(commentsWithLikes, { status: 200, headers: res.headers });
  } catch (e) {
    console.error('[api/logbook/comments] Unexpected error:', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { entryId: string } }
) {
  const res = NextResponse.json(null, { status: 200 });

  try {
    const supabase = createSupabaseServerClient(req, res);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { entryId } = params;
    const { text, parentId } = await req.json();

    if (!entryId) {
      return NextResponse.json({ error: 'Missing entryId' }, { status: 400 });
    }

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: 'Comment text is required' }, { status: 400 });
    }

    // Check if entry exists
    const { data: entry, error: entryError } = await supabase
      .from('logbook_entries')
      .select('id, allow_comments')
      .eq('id', entryId)
      .single();

    if (entryError || !entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    if (!entry.allow_comments) {
      return NextResponse.json({ error: 'Comments are disabled for this entry' }, { status: 403 });
    }

    // If parentId is provided, check if parent comment exists
    if (parentId) {
      const { data: parentComment, error: parentError } = await supabase
        .from('comments')
        .select('id')
        .eq('id', parentId)
        .eq('entry_id', entryId)
        .single();

      if (parentError || !parentComment) {
        return NextResponse.json({ error: 'Parent comment not found' }, { status: 404 });
      }
    }

    // Create comment
    const { data: comment, error: insertError } = await supabase
      .from('comments')
      .insert({
        entry_id: entryId,
        author_id: user.id,
        parent_id: parentId || null,
        text: text.trim()
      })
      .select(`
        id,
        entry_id,
        author_id,
        parent_id,
        text,
        created_at,
        updated_at,
        profiles!comments_author_id_fkey (
          id,
          handle,
          avatar_url
        )
      `)
      .single();

    if (insertError) {
      console.error('Error creating comment:', insertError);
      return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
    }

    return NextResponse.json(comment, { status: 201, headers: res.headers });
  } catch (e) {
    console.error('[api/logbook/comments] Unexpected error:', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
