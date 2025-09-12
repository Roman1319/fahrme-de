import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';

export const runtime = 'nodejs';

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

    if (!entryId) {
      return NextResponse.json({ error: 'Missing entryId' }, { status: 400 });
    }

    // Check if entry exists
    const { data: entry, error: entryError } = await supabase
      .from('logbook_entries')
      .select('id')
      .eq('id', entryId)
      .single();

    if (entryError || !entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    // Check if already liked
    const { data: existingLike, error: checkError } = await supabase
      .from('post_likes')
      .select('*')
      .eq('entry_id', entryId)
      .eq('user_id', user.id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking like:', checkError);
      return NextResponse.json({ error: 'Failed to check like status' }, { status: 500 });
    }

    if (existingLike) {
      return NextResponse.json({ error: 'Already liked' }, { status: 400 });
    }

    // Add like
    const { error: insertError } = await supabase
      .from('post_likes')
      .insert({
        entry_id: entryId,
        user_id: user.id
      });

    if (insertError) {
      console.error('Error adding like:', insertError);
      return NextResponse.json({ error: 'Failed to add like' }, { status: 500 });
    }

    return NextResponse.json({ success: true, liked: true }, { status: 200, headers: res.headers });
  } catch (e) {
    console.error('[api/logbook/like] Unexpected error:', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(
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

    if (!entryId) {
      return NextResponse.json({ error: 'Missing entryId' }, { status: 400 });
    }

    // Remove like
    const { error: deleteError } = await supabase
      .from('post_likes')
      .delete()
      .eq('entry_id', entryId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error removing like:', deleteError);
      return NextResponse.json({ error: 'Failed to remove like' }, { status: 500 });
    }

    return NextResponse.json({ success: true, liked: false }, { status: 200, headers: res.headers });
  } catch (e) {
    console.error('[api/logbook/like] Unexpected error:', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
