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
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ liked: false }, { status: 200, headers: res.headers });
    }

    const { entryId } = params;

    if (!entryId) {
      return NextResponse.json({ error: 'Missing entryId' }, { status: 400 });
    }

    // Check if user liked this entry
    const { data: like, error } = await supabase
      .from('post_likes')
      .select('*')
      .eq('entry_id', entryId)
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking like status:', error);
      return NextResponse.json({ error: 'Failed to check like status' }, { status: 500 });
    }

    return NextResponse.json({ liked: !!like }, { status: 200, headers: res.headers });
  } catch (e) {
    console.error('[api/logbook/like-status] Unexpected error:', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
