-- Полное исправление политик Storage для car-photos
-- Выполните этот код в Supabase SQL Editor

-- 1. Сначала проверим существующие политики
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';

-- 2. Удаляем все существующие политики для car-photos
DROP POLICY IF EXISTS "Users can upload car photos for their own cars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete car photos for their own cars" ON storage.objects;
DROP POLICY IF EXISTS "Car photos are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Logbook media is publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload logbook media for their own entries" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete logbook media for their own entries" ON storage.objects;

-- 3. Создаем простые политики для тестирования
-- Политика для чтения (все могут читать)
CREATE POLICY "Allow public read access to storage" ON storage.objects
  FOR SELECT USING (true);

-- Политика для загрузки (только аутентифицированные пользователи)
CREATE POLICY "Allow authenticated users to upload" ON storage.objects
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Политика для обновления (только аутентифицированные пользователи)
CREATE POLICY "Allow authenticated users to update" ON storage.objects
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Политика для удаления (только аутентифицированные пользователи)
CREATE POLICY "Allow authenticated users to delete" ON storage.objects
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- 4. Проверяем, что политики созданы
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';
