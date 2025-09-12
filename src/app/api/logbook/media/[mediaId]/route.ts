import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';

export const runtime = 'nodejs';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { mediaId: string } }
) {
  const res = NextResponse.json(null, { status: 200 });

  try {
    const supabase = createSupabaseServerClient(req, res);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { mediaId } = params;

    if (!mediaId) {
      return NextResponse.json({ error: 'Missing mediaId' }, { status: 400 });
    }

    // Получаем информацию о медиа
    const { data: media, error: mediaError } = await supabase
      .from('logbook_media')
      .select('id, storage_path, entry_id, logbook_entries(author_id)')
      .eq('id', mediaId)
      .single();

    if (mediaError || !media) {
      console.error('[api/logbook/media] Media not found:', mediaError);
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }

    // Проверяем права доступа
    if (media.logbook_entries?.author_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Валидируем путь
    if (!media.storage_path.startsWith(`${user.id}/`)) {
      console.error('[api/logbook/media] Invalid storage path:', media.storage_path);
      return NextResponse.json({ error: 'Invalid storage path' }, { status: 400 });
    }

    // Удаляем файл из Storage
    const { error: deleteError } = await supabase.storage
      .from('logbook')
      .remove([media.storage_path]);

    if (deleteError) {
      console.error('[api/logbook/media] Delete error:', deleteError);
      return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
    }

    // Удаляем запись из базы данных
    const { error: dbError } = await supabase
      .from('logbook_media')
      .delete()
      .eq('id', mediaId);

    if (dbError) {
      console.error('[api/logbook/media] Database delete error:', dbError);
      return NextResponse.json({ error: 'Failed to delete media record' }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200, headers: res.headers });
  } catch (e) {
    console.error('[api/logbook/media] Unexpected error:', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
