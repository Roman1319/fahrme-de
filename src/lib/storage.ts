// src/lib/storage.ts
import { supabase } from '@/lib/supabaseClient';

export async function uploadCarPhoto(file: File, carId: string, userId: string) {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${userId}/${carId}/${Date.now()}.${ext}`;

  // Проверяем, есть ли у пользователя права на этот автомобиль
  const { data: car, error: carError } = await supabase
    .from('cars')
    .select('id, owner_id')
    .eq('id', carId)
    .eq('owner_id', userId)
    .single();

  if (carError || !car) {
    console.error('Car ownership check failed:', carError);
    throw new Error('У вас нет прав на загрузку фотографий для этого автомобиля');
  }

  const { error: upErr } = await supabase.storage
    .from('car-photos')
    .upload(path, file, { upsert: false });

  if (upErr) {
    console.error('Upload error:', upErr);
    throw upErr;
  }

  const { data: pub } = supabase.storage.from('car-photos').getPublicUrl(path);
  
  // Создаем запись в таблице car_photos
  const { data: photoData, error: photoError } = await supabase
    .from('car_photos')
    .insert({
      car_id: carId,
      storage_path: path
    })
    .select()
    .single();

  if (photoError) {
    console.error('Error creating car_photos record:', photoError);
    throw new Error('Ошибка при сохранении информации о фотографии');
  }

  return { storagePath: path, publicUrl: pub.publicUrl, photoData };
}

export async function deleteCarPhoto(storagePath: string, userId: string, carId: string) {
  // Проверяем, есть ли у пользователя права на этот автомобиль
  const { data: car, error: carError } = await supabase
    .from('cars')
    .select('id, owner_id')
    .eq('id', carId)
    .eq('owner_id', userId)
    .single();

  if (carError || !car) {
    console.error('Car ownership check failed:', carError);
    throw new Error('У вас нет прав на удаление фотографий этого автомобиля');
  }

  // Валидируем путь
  if (!storagePath.startsWith(`${userId}/${carId}/`)) {
    throw new Error('Недопустимый путь к файлу');
  }

  // Удаляем файл из Storage
  const { error: deleteError } = await supabase.storage
    .from('car-photos')
    .remove([storagePath]);

  if (deleteError) {
    console.error('Delete error:', deleteError);
    throw deleteError;
  }

  // Удаляем запись из таблицы car_photos
  const { error: dbError } = await supabase
    .from('car_photos')
    .delete()
    .eq('storage_path', storagePath);

  if (dbError) {
    console.error('Database delete error:', dbError);
    throw new Error('Ошибка при удалении записи о фотографии');
  }

  return true;
}
