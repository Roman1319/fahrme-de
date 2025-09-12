import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const res = NextResponse.json(null, { status: 200 });

  try {
    const supabase = createSupabaseServerClient(req, res);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // допустим, multipart/form-data с entryId и файлом:
    const form = await req.formData();
    const entryId = String(form.get('entryId'));
    const file = form.get('file') as File;

    if (!file || !entryId) {
      return NextResponse.json({ error: 'Missing file or entryId' }, { status: 400 });
    }

    // проверяем, что пост принадлежит пользователю
    const { data: entry, error: entryErr } = await supabase
      .from('logbook_entries')
      .select('id, author_id')
      .eq('id', entryId)
      .single();

    if (entryErr || !entry || entry.author_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const fileName = file.name || 'upload';
    const filePath = `${user.id}/${entryId}/${fileName}`; // ВАЖНО: префикс userId

    const { error: uploadErr } = await supabase.storage
      .from('logbook')
      .upload(filePath, file, { upsert: false });

    if (uploadErr) {
      console.error('[api/logbook/media] Upload error:', uploadErr);
      return NextResponse.json({ error: 'Upload failed' }, { status: 400 });
    }

    // можно записать запись в logbook_media при желании
    // await supabase.from('logbook_media').insert({ entry_id: entryId, url: filePath });

    return NextResponse.json({ path: filePath }, { status: 201, headers: res.headers });
  } catch (e) {
    console.error('[api/logbook/media] Unexpected:', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
