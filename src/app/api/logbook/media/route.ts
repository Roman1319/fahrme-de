import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { uploadLogbookMedia } from '@/lib/logbook';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const entryId = formData.get('entryId') as string;

    if (!file || !entryId) {
      return NextResponse.json({ error: 'Missing file or entryId' }, { status: 400 });
    }

    const media = await uploadLogbookMedia(entryId, file, user.id);

    return NextResponse.json(media);
  } catch (error) {
    console.error('Error uploading logbook media:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
