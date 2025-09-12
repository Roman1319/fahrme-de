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

    // Получаем данные из multipart/form-data
    const form = await req.formData();
    const file = form.get('file') as File;
    const carId = String(form.get('carId'));
    const userId = String(form.get('userId'));

    if (!file || !carId || !userId) {
      return NextResponse.json({ error: 'Missing file, carId, or userId' }, { status: 400 });
    }

    // Проверяем, что userId соответствует аутентифицированному пользователю
    if (userId !== user.id) {
      return NextResponse.json({ error: 'User ID mismatch' }, { status: 403 });
    }

    // Валидация типа файла (включая HEIC)
    const isValidImageType = file.type.startsWith('image/') || 
      file.name.toLowerCase().endsWith('.heic') || 
      file.name.toLowerCase().endsWith('.heif');
    
    if (!isValidImageType) {
      return NextResponse.json({ error: 'Invalid file type. Only image files are allowed.' }, { status: 400 });
    }

    // Проверяем права на автомобиль
    const { data: car, error: carError } = await supabase
      .from('cars')
      .select('id, owner_id')
      .eq('id', carId)
      .eq('owner_id', userId)
      .single();

    if (carError || !car) {
      console.error('[api/cars/photos] Car ownership check failed:', carError);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Генерируем уникальное имя файла
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${carId}/${fileName}`;

    // Загружаем файл в Storage
    const { error: uploadError } = await supabase.storage
      .from('car-photos')
      .upload(filePath, file, { 
        cacheControl: '3600',
        upsert: false 
      });

    if (uploadError) {
      console.error('[api/cars/photos] Upload error:', uploadError);
      return NextResponse.json({ error: 'Upload failed' }, { status: 400 });
    }

    // Получаем публичный URL
    const { data: publicUrlData } = supabase.storage
      .from('car-photos')
      .getPublicUrl(filePath);

    // Сохраняем запись в базе данных
    const { data: photoData, error: photoError } = await supabase
      .from('car_photos')
      .insert({
        car_id: carId,
        storage_path: filePath
      })
      .select()
      .single();

    if (photoError) {
      console.error('[api/cars/photos] Error saving photo record:', photoError);
      // Удаляем загруженный файл, если не удалось сохранить запись
      await supabase.storage.from('car-photos').remove([filePath]);
      return NextResponse.json({ error: 'Failed to save photo record' }, { status: 500 });
    }

    return NextResponse.json({ 
      id: photoData.id,
      storage_path: filePath,
      public_url: publicUrlData.publicUrl,
      car_id: carId
    }, { status: 201, headers: res.headers });
  } catch (e) {
    console.error('[api/cars/photos] Unexpected error:', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
