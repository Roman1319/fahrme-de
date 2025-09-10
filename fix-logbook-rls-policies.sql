-- Исправление политик RLS для logbook_entries
-- Проблема: текущая политика требует, чтобы пользователь был владельцем автомобиля
-- Решение: разрешить создание записей аутентифицированным пользователям

-- Сначала изменяем схему таблицы, чтобы car_id мог быть NULL
ALTER TABLE logbook_entries ALTER COLUMN car_id DROP NOT NULL;

-- Удаляем старую политику
DROP POLICY IF EXISTS "Users can insert entries for own cars" ON logbook_entries;

-- Создаем новую политику, которая разрешает создание записей аутентифицированным пользователям
CREATE POLICY "Authenticated users can insert logbook entries" ON logbook_entries
  FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Также обновляем политику для обновления, чтобы пользователи могли редактировать свои записи
DROP POLICY IF EXISTS "Users can update own entries" ON logbook_entries;
CREATE POLICY "Users can update own logbook entries" ON logbook_entries
  FOR UPDATE USING (auth.uid() = author_id);

-- И для удаления
DROP POLICY IF EXISTS "Users can delete own entries" ON logbook_entries;
CREATE POLICY "Users can delete own logbook entries" ON logbook_entries
  FOR DELETE USING (auth.uid() = author_id);
