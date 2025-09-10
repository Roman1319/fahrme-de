-- БЫСТРОЕ ИСПРАВЛЕНИЕ POST_LIKES ТАБЛИЦЫ
-- Выполнить в Supabase SQL Editor

-- 1. Создать таблицу post_likes
CREATE TABLE IF NOT EXISTS post_likes (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  entry_id UUID REFERENCES logbook_entries(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, entry_id)
);

-- 2. Включить RLS
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

-- 3. Удалить все существующие политики
DROP POLICY IF EXISTS "Post likes are viewable by everyone" ON post_likes;
DROP POLICY IF EXISTS "Users can manage own post likes" ON post_likes;
DROP POLICY IF EXISTS "Post likes are viewable by everyone" ON post_likes;
DROP POLICY IF EXISTS "Users can manage own post likes" ON post_likes;

-- 4. Создать новые политики
CREATE POLICY "Post likes are viewable by everyone" ON post_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own post likes" ON post_likes
  FOR ALL USING (auth.uid() = user_id);

-- 5. Создать индексы
CREATE INDEX IF NOT EXISTS idx_post_likes_entry_id ON post_likes(entry_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);

-- 6. Проверить что таблица создана
SELECT * FROM post_likes LIMIT 1;
