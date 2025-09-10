import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createLogbookEntry } from '@/lib/logbook';

export async function POST(request: NextRequest) {
  try {
    console.log('API: Starting logbook entry creation');
    
    const supabase = createClient();
    
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('API: Missing or invalid authorization header');
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }
    
    const token = authHeader.substring(7);
    console.log('API: Got token, length:', token.length);
    
    // Set the session with the token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.log('API: Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('API: User authenticated:', user.id);

    const body = await request.json();
    const { car_id, title, content, topic, allow_comments } = body;

    console.log('API: Request body:', { car_id, title: title?.substring(0, 50), content: content?.substring(0, 50), topic, allow_comments });

    if (!car_id || !title || !content) {
      console.log('API: Missing required fields');
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    console.log('API: Calling createLogbookEntry...');
    
    // Create entry directly with server client
    const { data, error } = await supabase
      .from('logbook_entries')
      .insert({
        car_id,
        title,
        content,
        topic,
        allow_comments: allow_comments ?? true,
        author_id: user.id
      })
      .select()
      .single();

    if (error) {
      console.error('API: Database error:', error);
      throw error;
    }

    const entry = data;

    console.log('API: Entry created successfully:', entry.id);
    return NextResponse.json(entry);
  } catch (error) {
    console.error('API: Error creating logbook entry:', error);
    console.error('API: Error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
