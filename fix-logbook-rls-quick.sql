-- Быстрое исправление RLS политик для logbook_entries
-- Выполнить в Supabase SQL Editor

-- 1. Сначала отключаем RLS временно
ALTER TABLE logbook_entries DISABLE ROW LEVEL SECURITY;

-- 2. Удаляем все существующие политики
DROP POLICY IF EXISTS "Logbook entries are viewable by everyone" ON logbook_entries;
DROP POLICY IF EXISTS "Users can insert entries for own cars" ON logbook_entries;
DROP POLICY IF EXISTS "Authenticated users can insert logbook entries" ON logbook_entries;
DROP POLICY IF EXISTS "Users can update own entries" ON logbook_entries;
DROP POLICY IF EXISTS "Users can update own logbook entries" ON logbook_entries;
DROP POLICY IF EXISTS "Users can delete own entries" ON logbook_entries;
DROP POLICY IF EXISTS "Users can delete own logbook entries" ON logbook_entries;

-- 3. Изменяем схему таблицы (если еще не изменена)
ALTER TABLE logbook_entries ALTER COLUMN car_id DROP NOT NULL;

-- 4. Включаем RLS обратно
ALTER TABLE logbook_entries ENABLE ROW LEVEL SECURITY;

-- 5. Создаем новые политики
CREATE POLICY "Logbook entries are viewable by everyone" ON logbook_entries
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert logbook entries" ON logbook_entries
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own logbook entries" ON logbook_entries
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete own logbook entries" ON logbook_entries
  FOR DELETE USING (auth.uid() = author_id);
