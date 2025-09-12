import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';

export const runtime = 'nodejs';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { carId: string; photoId: string } }
) {
  const res = NextResponse.json(null, { status: 200 });

  try {
    const supabase = createSupabaseServerClient(req, res);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { carId, photoId } = params;

    if (!carId || !photoId) {
      return NextResponse.json({ error: 'Missing carId or photoId' }, { status: 400 });
    }

    // Проверяем права на автомобиль
    const { data: car, error: carError } = await supabase
      .from('cars')
      .select('id, owner_id')
      .eq('id', carId)
      .eq('owner_id', user.id)
      .single();

    if (carError || !car) {
      console.error('[api/cars/photos] Car ownership check failed:', carError);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Получаем информацию о фото
    const { data: photo, error: photoError } = await supabase
      .from('car_photos')
      .select('id, storage_path')
      .eq('id', photoId)
      .eq('car_id', carId)
      .single();

    if (photoError || !photo) {
      console.error('[api/cars/photos] Photo not found:', photoError);
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }

    // Валидируем путь
    if (!photo.storage_path.startsWith(`${user.id}/${carId}/`)) {
      console.error('[api/cars/photos] Invalid storage path:', photo.storage_path);
      return NextResponse.json({ error: 'Invalid storage path' }, { status: 400 });
    }

    // Удаляем файл из Storage
    const { error: deleteError } = await supabase.storage
      .from('car-photos')
      .remove([photo.storage_path]);

    if (deleteError) {
      console.error('[api/cars/photos] Delete error:', deleteError);
      return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
    }

    // Удаляем запись из базы данных
    const { error: dbError } = await supabase
      .from('car_photos')
      .delete()
      .eq('id', photoId);

    if (dbError) {
      console.error('[api/cars/photos] Database delete error:', dbError);
      return NextResponse.json({ error: 'Failed to delete photo record' }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200, headers: res.headers });
  } catch (e) {
    console.error('[api/cars/photos] Unexpected error:', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
