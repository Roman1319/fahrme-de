import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';

export const runtime = 'nodejs';

export async function DELETE(req: NextRequest) {
  const res = NextResponse.json(null, { status: 200 });

  try {
    const supabase = createSupabaseServerClient(req, res);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { storagePath } = await req.json();

    if (!storagePath) {
      return NextResponse.json({ error: 'Missing storagePath' }, { status: 400 });
    }

    // Валидируем путь
    if (!storagePath.startsWith(`${user.id}/`)) {
      console.error('[api/profile/avatar] Invalid storage path:', storagePath);
      return NextResponse.json({ error: 'Invalid storage path' }, { status: 400 });
    }

    // Удаляем файл из Storage
    const { error: deleteError } = await supabase.storage
      .from('avatars')
      .remove([storagePath]);

    if (deleteError) {
      console.error('[api/profile/avatar] Delete error:', deleteError);
      return NextResponse.json({ error: 'Failed to delete avatar' }, { status: 500 });
    }

    // Обновляем профиль пользователя, убирая ссылку на аватар
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: null })
      .eq('id', user.id);

    if (updateError) {
      console.error('[api/profile/avatar] Profile update error:', updateError);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200, headers: res.headers });
  } catch (e) {
    console.error('[api/profile/avatar] Unexpected error:', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
